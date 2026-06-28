import { prisma } from '@/database/prisma.ts';
import HttpError from '@/errors/HttpError.ts';
import type { Genero, GeneroInput } from '@/types/Genero.d.ts';

async function readAll(): Promise<Genero[]> {
  const rows = await prisma.genero.findMany({
    orderBy: { nome_genero: 'asc' },
    include: { _count: { select: { jogo_genero: true } } },
  });
  return rows.map(r => ({ id_genero: r.id_genero, nome_genero: r.nome_genero, total_jogos: r._count?.jogo_genero }));
}

async function readById(id: number): Promise<Genero> {
  const r = await prisma.genero.findUnique({ where: { id_genero: id } });
  if (!r) throw new HttpError('Gênero não encontrado', 404);
  return { id_genero: r.id_genero, nome_genero: r.nome_genero };
}

async function create(data: GeneroInput): Promise<Genero> {
  const { nome_genero } = data;
  if (!nome_genero) throw new HttpError('O campo nome_genero é obrigatório');
  const r = await prisma.genero.create({ data: { nome_genero } });
  return { id_genero: r.id_genero, nome_genero: r.nome_genero };
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.genero.delete({ where: { id_genero: id } });
    return true;
  } catch (e) {
    throw new HttpError('Gênero não encontrado', 404);
  }
}

export default { readAll, readById, create, remove };