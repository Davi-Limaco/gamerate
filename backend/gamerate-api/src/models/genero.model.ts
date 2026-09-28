import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import type { Genero, GeneroInput } from '@/types/Genero.d.ts';

async function readAll(): Promise<Genero[]> {
  const rows = await prisma.genero.findMany({ orderBy: { nome_genero: 'asc' }, include: { _count: { select: { jogos: true } } } });
  return rows.map(({ id_genero, nome_genero, _count }) => ({ id_genero, nome_genero, total_jogos: _count.jogos }));
}

async function readById(id: number): Promise<Genero> {
  const row = await prisma.genero.findUnique({ where: { id_genero: id } });
  if (row) return row;
  throw new HttpError('Gênero não encontrado', 404);
}

async function create(data: GeneroInput): Promise<Genero> {
  try {
    return await prisma.genero.create({ data: { nome_genero: data.nome_genero! } });
  } catch (error) {
    throwPrismaError(error, 'Gênero');
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.jogoGenero.deleteMany({ where: { id_genero_fk: id } });
      await tx.genero.delete({ where: { id_genero: id } });
    });
    return true;
  } catch (error) {
    throwPrismaError(error, 'Gênero');
  }
}

export default { readAll, readById, create, remove };