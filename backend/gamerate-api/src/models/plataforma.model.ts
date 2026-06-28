import { prisma } from '@/database/prisma.ts';
import HttpError from '@/errors/HttpError.ts';
import type { Plataforma, PlataformaInput } from '@/types/Plataforma.d.ts';

async function readAll(): Promise<Plataforma[]> {
  const rows = await prisma.plataforma.findMany({
    orderBy: { nome_plataforma: 'asc' },
    include: { _count: { select: { jogo_plataforma: true } } },
  });
  return rows.map(r => ({ id_plataforma: r.id_plataforma, nome_plataforma: r.nome_plataforma, total_jogos: r._count?.jogo_plataforma }));
}

async function readById(id: number): Promise<Plataforma> {
  const r = await prisma.plataforma.findUnique({ where: { id_plataforma: id } });
  if (!r) throw new HttpError('Plataforma não encontrada', 404);
  return { id_plataforma: r.id_plataforma, nome_plataforma: r.nome_plataforma };
}

async function create(data: PlataformaInput): Promise<Plataforma> {
  const { nome_plataforma } = data;
  if (!nome_plataforma) throw new HttpError('O campo nome_plataforma é obrigatório');
  const r = await prisma.plataforma.create({ data: { nome_plataforma } });
  return { id_plataforma: r.id_plataforma, nome_plataforma: r.nome_plataforma };
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.plataforma.delete({ where: { id_plataforma: id } });
    return true;
  } catch (e) {
    throw new HttpError('Plataforma não encontrada', 404);
  }
}

export default { readAll, readById, create, remove };