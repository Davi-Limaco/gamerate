import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import type { Plataforma, PlataformaInput } from '@/types/Plataforma.d.ts';

async function readAll(): Promise<Plataforma[]> {
  const rows = await prisma.plataforma.findMany({ orderBy: { nome_plataforma: 'asc' }, include: { _count: { select: { jogos: true } } } });
  return rows.map(({ id_plataforma, nome_plataforma, _count }) => ({ id_plataforma, nome_plataforma, total_jogos: _count.jogos }));
}

async function readById(id: number): Promise<Plataforma> {
  const row = await prisma.plataforma.findUnique({ where: { id_plataforma: id } });
  if (row) return row;
  throw new HttpError('Plataforma não encontrada', 404);
}

async function create(data: PlataformaInput): Promise<Plataforma> {
  try {
    return await prisma.plataforma.create({ data: { nome_plataforma: data.nome_plataforma! } });
  } catch (error) {
    throwPrismaError(error, 'Plataforma');
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.jogoPlataforma.deleteMany({ where: { id_plataforma_fk: id } });
      await tx.plataforma.delete({ where: { id_plataforma: id } });
    });
    return true;
  } catch (error) {
    throwPrismaError(error, 'Plataforma');
  }
}

export default { readAll, readById, create, remove };