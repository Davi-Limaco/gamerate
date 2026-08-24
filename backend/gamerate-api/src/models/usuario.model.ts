import { prisma } from '@/database/prisma.ts';
import type { Usuario, UsuarioInput } from '@/types/Usuario.d.ts';
import type { Avaliacao } from '@/types/Avaliacao.d.ts';
import HttpError from '@/errors/HttpError.ts';
import { hashPassword } from '@/utils/password.ts';

function dateToString(d?: Date | null) {
  if (!d) return undefined;
  return d.toISOString().split('T')[0];
}

async function readAll(): Promise<Usuario[]> {
  const rows = await prisma.usuario.findMany({
    orderBy: { id_usuario: 'asc' },
    include: { perfil: { select: { nome_perfil: true } }, _count: { select: { avaliacao: true } } },
  });

  return rows.map(r => ({
    id_usuario: r.id_usuario,
    nome_usuario: r.nome_usuario,
    email: r.email,
    senha: undefined,
    id_perfil_fk: r.id_perfil_fk,
    nome_perfil: r.perfil?.nome_perfil,
    data_criacao: dateToString(r.data_criacao),
    total_avaliacoes: r._count?.avaliacao ?? 0,
  }));
}

async function readById(id: number): Promise<Usuario> {
  const r = await prisma.usuario.findUnique({
    where: { id_usuario: id },
    include: { perfil: { select: { nome_perfil: true } }, _count: { select: { avaliacao: true } } },
  });
  if (!r) throw new HttpError('Usuário não encontrado', 404);
  return {
    id_usuario: r.id_usuario,
    nome_usuario: r.nome_usuario,
    email: r.email,
    senha: undefined,
    id_perfil_fk: r.id_perfil_fk,
    nome_perfil: r.perfil?.nome_perfil,
    data_criacao: dateToString(r.data_criacao),
    total_avaliacoes: r._count?.avaliacao ?? 0,
  };
}

async function readByEmail(email: string): Promise<Usuario | undefined> {
  const r = await prisma.usuario.findFirst({ where: { email }, include: { perfil: { select: { nome_perfil: true } } } });
  if (!r) return undefined;
  return {
    id_usuario: r.id_usuario,
    nome_usuario: r.nome_usuario,
    email: r.email,
    senha: undefined,
    id_perfil_fk: r.id_perfil_fk,
    nome_perfil: r.perfil?.nome_perfil,
    data_criacao: dateToString(r.data_criacao),
    total_avaliacoes: undefined,
  };
}

async function readByEmailWithPassword(email: string): Promise<Usuario | undefined> {
  const r = await prisma.usuario.findFirst({ where: { email }, include: { perfil: { select: { nome_perfil: true } } } });
  if (!r) return undefined;
  return {
    id_usuario: r.id_usuario,
    nome_usuario: r.nome_usuario,
    email: r.email,
    senha: r.senha,
    id_perfil_fk: r.id_perfil_fk,
    nome_perfil: r.perfil?.nome_perfil,
    data_criacao: dateToString(r.data_criacao),
    total_avaliacoes: undefined,
  };
}

async function create({ nome_usuario, email, senha, id_perfil_fk = 1 }: UsuarioInput): Promise<Usuario> {
  if (!nome_usuario || !email || !senha) {
    throw new HttpError('Campos obrigatórios: nome_usuario, email, senha');
  }

  const r = await prisma.usuario.create({ data: { nome_usuario, email, senha: hashPassword(senha), id_perfil_fk } });
  return readById(r.id_usuario);
}

async function update({ id, nome_usuario, email, senha }: UsuarioInput & { id?: number }): Promise<Usuario> {
  if (!id) throw new HttpError('Usuário não encontrado', 404);

  const data: any = {};
  if (nome_usuario) data.nome_usuario = nome_usuario;
  if (email) data.email = email;
  if (senha) {
    data.senha = hashPassword(senha);
  }

  if (Object.keys(data).length === 0) throw new HttpError('Nenhum campo para atualizar');

  try {
    await prisma.usuario.update({ where: { id_usuario: id }, data });
    return readById(id);
  } catch (e) {
    throw new HttpError('Usuário não encontrado', 404);
  }
}

async function updatePerfil({ id, id_perfil_fk }: { id?: number; id_perfil_fk?: number }): Promise<Usuario> {
  if (!id || id_perfil_fk === undefined) {
    throw new HttpError('Os campos id e id_perfil_fk são obrigatórios');
  }

  try {
    await prisma.usuario.update({ where: { id_usuario: id }, data: { id_perfil_fk } });
    return readById(id);
  } catch (e) {
    throw new HttpError('Usuário não encontrado', 404);
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.usuario.delete({ where: { id_usuario: id } });
    return true;
  } catch (e) {
    throw new HttpError('Usuário não encontrado', 404);
  }
}

async function readAvaliacoes(id: number): Promise<Avaliacao[]> {
  const rows = await prisma.avaliacao.findMany({
    where: { id_usuario_fk: id },
    include: { jogo: { select: { id_jogo: true, nome_jogo: true, capa: true } } },
    orderBy: { data_publicacao: 'desc' },
  });

  return rows.map(r => ({
    id_avaliacao: r.id_avaliacao,
    id_usuario_fk: r.id_usuario_fk,
    id_jogo_fk: r.id_jogo_fk,
    nota: r.nota,
    titulo: r.titulo,
    texto: r.texto,
    data_publicacao: dateToString(r.data_publicacao)!,
    nome_usuario: undefined,
    nome_jogo: r.jogo?.nome_jogo,
    capa: r.jogo?.capa ?? null,
    id_usuario: undefined,
    id_jogo: r.jogo?.id_jogo,
  }));
}

export default { readAll, readById, readByEmail, readByEmailWithPassword, create, update, updatePerfil, remove, readAvaliacoes };
