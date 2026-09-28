import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import Jogo from '@/models/jogo.model.ts';
import { toDateOnly } from '@/utils/dates.ts';
import type { Avaliacao, AvaliacaoFilter, AvaliacaoInput } from '@/types/Avaliacao.d.ts';

function mapAvaliacao(avaliacao: {
  id_avaliacao: number;
  id_usuario_fk: number;
  id_jogo_fk: number;
  nota: number;
  titulo: string;
  texto: string;
  data_publicacao: Date;
  usuario?: { id_usuario: number; nome_usuario: string };
  jogo?: { id_jogo: number; nome_jogo: string; capa: string | null };
}): Avaliacao {
  return {
    id_avaliacao: avaliacao.id_avaliacao,
    id_usuario_fk: avaliacao.id_usuario_fk,
    id_jogo_fk: avaliacao.id_jogo_fk,
    nota: avaliacao.nota,
    titulo: avaliacao.titulo,
    texto: avaliacao.texto,
    data_publicacao: toDateOnly(avaliacao.data_publicacao),
    nome_usuario: avaliacao.usuario?.nome_usuario,
    nome_jogo: avaliacao.jogo?.nome_jogo,
    capa: avaliacao.jogo?.capa,
    id_usuario: avaliacao.usuario?.id_usuario,
    id_jogo: avaliacao.jogo?.id_jogo,
  };
}

const relations = { usuario: { select: { id_usuario: true, nome_usuario: true } }, jogo: { select: { id_jogo: true, nome_jogo: true, capa: true } } };

async function readAll(filter: AvaliacaoFilter = {}): Promise<Avaliacao[]> {
  const rows = await prisma.avaliacao.findMany({
    where: filter.jogo_id ? { id_jogo_fk: filter.jogo_id } : undefined,
    orderBy: { data_publicacao: 'desc' },
    include: relations,
  });
  return rows.map(mapAvaliacao);
}

async function readById(id: number): Promise<Avaliacao> {
  const row = await prisma.avaliacao.findUnique({ where: { id_avaliacao: id }, include: relations });
  if (!row) throw new HttpError('Avaliação não encontrada', 404);
  return mapAvaliacao(row);
}

async function create(input: AvaliacaoInput): Promise<Avaliacao> {
  try {
    const row = await prisma.avaliacao.create({
      data: {
        id_usuario_fk: input.id_usuario_fk!,
        id_jogo_fk: input.id_jogo_fk!,
        nota: input.nota!,
        titulo: input.titulo!,
        texto: input.texto!,
        data_publicacao: new Date(),
      },
    });
    await Jogo.atualizarNota(row.id_jogo_fk);
    return readById(row.id_avaliacao);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      throw new HttpError('Você já avaliou este jogo', 409);
    }
    throwPrismaError(error, 'Avaliação');
  }
}

async function update(input: AvaliacaoInput & { id?: number }): Promise<Avaliacao> {
  if (input.id === undefined) throw new HttpError('ID da avaliação inválido', 400);

  try {
    const row = await prisma.avaliacao.update({
      where: { id_avaliacao: input.id },
      data: {
        ...(input.nota !== undefined ? { nota: input.nota } : {}),
        ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
        ...(input.texto !== undefined ? { texto: input.texto } : {}),
      },
    });
    await Jogo.atualizarNota(row.id_jogo_fk);
    return readById(row.id_avaliacao);
  } catch (error) {
    throwPrismaError(error, 'Avaliação');
  }
}

async function remove(id: number): Promise<boolean> {
  const row = await prisma.avaliacao.findUnique({ where: { id_avaliacao: id }, select: { id_jogo_fk: true } });
  if (!row) throw new HttpError('Avaliação não encontrada', 404);

  await prisma.avaliacao.delete({ where: { id_avaliacao: id } });
  await Jogo.atualizarNota(row.id_jogo_fk);
  return true;
}

async function getDestaque(): Promise<Avaliacao[]> {
  const rows = await prisma.avaliacao.findMany({
    orderBy: [{ nota: 'desc' }, { data_publicacao: 'desc' }],
    take: 6,
    include: relations,
  });
  return rows.map(mapAvaliacao);
}

export default { readAll, readById, create, update, remove, getDestaque };
