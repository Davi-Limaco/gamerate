import { Prisma } from '@prisma/client';

import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import { toDateOnly } from '@/utils/dates.ts';
import { hashPassword } from '@/utils/password.ts';
import type { Avaliacao } from '@/types/Avaliacao.d.ts';
import type { Usuario, UsuarioInput } from '@/types/Usuario.d.ts';

function mapUsuario(usuario: {
  id_usuario: number;
  nome_usuario: string;
  email: string;
  senha?: string;
  id_perfil_fk: number;
  data_criacao: Date;
  perfil: { nome_perfil: string };
  _count?: { avaliacoes: number };
}, includeSenha = false): Usuario {
  return {
    id_usuario: usuario.id_usuario,
    nome_usuario: usuario.nome_usuario,
    email: usuario.email,
    ...(includeSenha && usuario.senha !== undefined ? { senha: usuario.senha } : {}),
    id_perfil_fk: usuario.id_perfil_fk,
    nome_perfil: usuario.perfil.nome_perfil,
    data_criacao: toDateOnly(usuario.data_criacao),
    total_avaliacoes: usuario._count?.avaliacoes,
  };
}

async function readAll(): Promise<Usuario[]> {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { id_usuario: 'asc' },
    include: { perfil: { select: { nome_perfil: true } } },
  });
  return usuarios.map((usuario) => mapUsuario(usuario));
}

async function readById(id: number): Promise<Usuario> {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: id },
    include: { perfil: { select: { nome_perfil: true } }, _count: { select: { avaliacoes: true } } },
  });
  if (!usuario) throw new HttpError('Usuário não encontrado', 404);
  return mapUsuario(usuario);
}

// includeSenha=true aqui é intencional: é a única leitura de usuário que
// devolve o campo `senha` (contendo o HASH Argon2id, nunca a senha em texto
// puro) — usado exclusivamente pelo fluxo de login (auth.controller) para
// comparação via argon2.verify. Todas as demais leituras (readAll, readById)
// omitem esse campo por padrão.
async function readByEmail(email: string): Promise<Usuario | undefined> {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { perfil: { select: { nome_perfil: true } } },
  });
  return usuario ? mapUsuario(usuario, true) : undefined;
}

async function create(input: UsuarioInput): Promise<Usuario> {
  try {
    // A senha em texto puro nunca chega ao banco: é sempre transformada em
    // hash Argon2id antes do INSERT. A unicidade do e-mail é garantida pela
    // constraint `@unique` do schema Prisma — uma tentativa de duplicata
    // dispara um erro P2002, convertido abaixo em HttpError 409.
    const senhaHash = await hashPassword(input.senha!);

    const usuario = await prisma.usuario.create({
      data: {
        nome_usuario: input.nome_usuario!,
        email: input.email!,
        senha: senhaHash,
        id_perfil_fk: input.id_perfil_fk ?? 1,
        data_criacao: new Date(),
      },
      include: { perfil: { select: { nome_perfil: true } } },
    });
    return mapUsuario(usuario);
  } catch (error) {
    throwPrismaError(error, 'Usuário');
  }
}

async function update(input: UsuarioInput & { id?: number }): Promise<Usuario> {
  if (input.id === undefined) throw new HttpError('ID do usuário inválido', 400);

  const data: Prisma.UsuarioUpdateInput = {};
  if (input.nome_usuario !== undefined) data.nome_usuario = input.nome_usuario;
  if (input.email !== undefined) data.email = input.email;
  // Assim como no cadastro, uma nova senha enviada na atualização de perfil
  // também passa por hashPassword antes de ser persistida.
  if (input.senha !== undefined) data.senha = await hashPassword(input.senha);

  try {
    const usuario = await prisma.usuario.update({
      where: { id_usuario: input.id },
      data,
      include: { perfil: { select: { nome_perfil: true } } },
    });
    return mapUsuario(usuario);
  } catch (error) {
    throwPrismaError(error, 'Usuário');
  }
}

async function updatePerfil(input: { id?: number; id_perfil_fk?: number }): Promise<Usuario> {
  if (input.id === undefined || input.id_perfil_fk === undefined) throw new HttpError('ID ou perfil inválido', 400);
  try {
    const usuario = await prisma.usuario.update({
      where: { id_usuario: input.id },
      data: { id_perfil_fk: input.id_perfil_fk },
      include: { perfil: { select: { nome_perfil: true } } },
    });
    return mapUsuario(usuario);
  } catch (error) {
    throwPrismaError(error, 'Usuário');
  }
}

async function remove(id: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUnique({ where: { id_usuario: id }, select: { id_usuario: true } });
    if (!usuario) throw new HttpError('Usuário não encontrado', 404);
    if (await tx.avaliacao.count({ where: { id_usuario_fk: id } })) {
      throw new HttpError('Exclua as avaliações deste usuário antes de removê-lo', 409);
    }
    await tx.usuario.delete({ where: { id_usuario: id } });
    return true;
  });
}

async function readAvaliacoes(id: number): Promise<Avaliacao[]> {
  const rows = await prisma.avaliacao.findMany({
    where: { id_usuario_fk: id },
    orderBy: { data_publicacao: 'desc' },
    include: { jogo: { select: { id_jogo: true, nome_jogo: true, capa: true } } },
  });
  return rows.map((row) => ({
    id_avaliacao: row.id_avaliacao,
    id_usuario_fk: row.id_usuario_fk,
    id_jogo_fk: row.id_jogo_fk,
    id_jogo: row.jogo.id_jogo,
    nome_jogo: row.jogo.nome_jogo,
    capa: row.jogo.capa,
    nota: row.nota,
    titulo: row.titulo,
    texto: row.texto,
    data_publicacao: toDateOnly(row.data_publicacao),
  }));
}

export default { readAll, readById, readByEmail, create, update, updatePerfil, remove, readAvaliacoes };
