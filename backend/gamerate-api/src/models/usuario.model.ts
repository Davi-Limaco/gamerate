import Database from '@/database/database.ts';
import type { Usuario, UsuarioInput } from '@/types/Usuario.d.ts';
import type { Avaliacao } from '@/types/Avaliacao.d.ts';
import HttpError from '@/errors/HttpError.ts';

function mapUsuario(row: Record<string, unknown>): Usuario {
  return {
    id_usuario: row.id_usuario as number,
    nome_usuario: row.nome_usuario as string,
    email: row.email as string,
    senha: row.senha as string | undefined,
    id_perfil_fk: row.id_perfil_fk as number | undefined ?? 0,
    nome_perfil: row.nome_perfil as string | undefined,
    data_criacao: row.data_criacao as string | undefined,
    total_avaliacoes: row.total_avaliacoes as number | undefined,
  };
}

function mapAvaliacaoResumo(row: Record<string, unknown>): Avaliacao {
  return {
    id_avaliacao: row.id_avaliacao as number,
    id_usuario_fk: row.id_usuario_fk as number | undefined ?? 0,
    id_jogo_fk: row.id_jogo as number,
    nota: row.nota as number,
    titulo: row.titulo as string,
    texto: row.texto as string | undefined ?? '',
    data_publicacao: row.data_publicacao as string,
    nome_jogo: row.nome_jogo as string | undefined,
    capa: row.capa as string | null | undefined,
    id_jogo: row.id_jogo as number | undefined,
  };
}

async function readAll(): Promise<Usuario[]> {
  const db = await Database.connect();
  const rows = await db.all(
    `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
     FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk ORDER BY u.id_usuario`,
  );
  return rows.map(mapUsuario);
}

async function readById(id: number): Promise<Usuario> {
  const db = await Database.connect();
  const usuario = await db.get(
    `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil,
            (SELECT COUNT(*) FROM avaliacao a WHERE a.id_usuario_fk = u.id_usuario) AS total_avaliacoes
     FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk WHERE u.id_usuario = ?`,
    [id],
  );

  if (usuario) return mapUsuario(usuario);
  throw new HttpError('Usuário não encontrado', 404);
}

async function readByEmail(email: string): Promise<Usuario | undefined> {
  const db = await Database.connect();
  const usuario = await db.get(
    `SELECT u.id_usuario, u.nome_usuario, u.email, u.senha, p.nome_perfil
     FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk WHERE u.email = ?`,
    [email],
  );

  return usuario ? mapUsuario(usuario) : undefined;
}

async function create({ nome_usuario, email, senha, id_perfil_fk = 1 }: UsuarioInput): Promise<Usuario> {
  const db = await Database.connect();

  if (!nome_usuario || !email || !senha) {
    throw new HttpError('Campos obrigatórios: nome_usuario, email, senha');
  }

  const { lastID } = await db.run(
    `INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk) VALUES (?, ?, ?, ?)`,
    [nome_usuario, email, senha, id_perfil_fk],
  );

  return await readById(lastID);
}

async function update({ id, nome_usuario, email, senha }: UsuarioInput & { id?: number }): Promise<Usuario> {
  const db = await Database.connect();

  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (nome_usuario) { fields.push('nome_usuario = ?'); params.push(nome_usuario); }
  if (email)        { fields.push('email = ?');        params.push(email); }
  if (senha)        { fields.push('senha = ?');        params.push(senha); }

  if (fields.length === 0) throw new HttpError('Nenhum campo para atualizar');

  params.push(id!);

  const { changes } = await db.run(`UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`, params);

  if (changes === 1) return readById(id!);
  throw new HttpError('Usuário não encontrado', 404);
}

async function updatePerfil({ id, id_perfil_fk }: { id?: number; id_perfil_fk?: number }): Promise<Usuario> {
  const db = await Database.connect();

  if (!id || id_perfil_fk === undefined) {
    throw new HttpError('Os campos id e id_perfil_fk são obrigatórios');
  }

  const { changes } = await db.run(`UPDATE usuario SET id_perfil_fk = ? WHERE id_usuario = ?`, [id_perfil_fk, id]);

  if (changes === 1) return readById(id!);
  throw new HttpError('Usuário não encontrado', 404);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const { changes } = await db.run(`DELETE FROM usuario WHERE id_usuario = ?`, [id]);

  if (changes === 1) return true;
  throw new HttpError('Usuário não encontrado', 404);
}

async function readAvaliacoes(id: number): Promise<Avaliacao[]> {
  const db = await Database.connect();
  const rows = await db.all(
    `SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao, j.id_jogo, j.nome_jogo, j.capa
     FROM avaliacao a JOIN jogo j ON j.id_jogo = a.id_jogo_fk
     WHERE a.id_usuario_fk = ? ORDER BY a.data_publicacao DESC`,
    [id],
  );
  return rows.map(mapAvaliacaoResumo);
}

export default { readAll, readById, readByEmail, create, update, updatePerfil, remove, readAvaliacoes };
