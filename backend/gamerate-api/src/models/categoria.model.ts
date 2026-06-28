import { prisma } from '@/database/prisma.ts';
import HttpError from '@/errors/HttpError.ts';
import type { Genero as GeneroType, Plataforma as PlataformaType, GeneroInput, PlataformaInput } from '@/types/Jogo.d.ts';

async function generoReadAll(): Promise<GeneroType[]> {
  const rows = await prisma.genero.findMany({ orderBy: { nome_genero: 'asc' }, include: { _count: { select: { jogo_genero: true } } } });
  return rows.map(r => ({ id_genero: r.id_genero, nome_genero: r.nome_genero, total_jogos: r._count?.jogo_genero }));
}

async function generoReadById(id: number): Promise<GeneroType> {
  const r = await prisma.genero.findUnique({ where: { id_genero: id } });
  if (!r) throw new HttpError('genero não encontrado', 404);
  return { id_genero: r.id_genero, nome_genero: r.nome_genero };
}

async function generoCreate(data: GeneroInput): Promise<GeneroType> {
  const { nome_genero } = data;
  if (!nome_genero) throw new HttpError('O campo nome_genero é obrigatório');
  const r = await prisma.genero.create({ data: { nome_genero } });
  return { id_genero: r.id_genero, nome_genero: r.nome_genero };
}

async function generoRemove(id: number): Promise<boolean> {
  try { await prisma.genero.delete({ where: { id_genero: id } }); return true; } catch (e) { throw new HttpError('genero não encontrado', 404); }
}

async function plataformaReadAll(): Promise<PlataformaType[]> {
  const rows = await prisma.plataforma.findMany({ orderBy: { nome_plataforma: 'asc' }, include: { _count: { select: { jogo_plataforma: true } } } });
  return rows.map(r => ({ id_plataforma: r.id_plataforma, nome_plataforma: r.nome_plataforma, total_jogos: r._count?.jogo_plataforma }));
}

async function plataformaReadById(id: number): Promise<PlataformaType> {
  const r = await prisma.plataforma.findUnique({ where: { id_plataforma: id } });
  if (!r) throw new HttpError('plataforma não encontrado', 404);
  return { id_plataforma: r.id_plataforma, nome_plataforma: r.nome_plataforma };
}

async function plataformaCreate(data: PlataformaInput): Promise<PlataformaType> {
  const { nome_plataforma } = data;
  if (!nome_plataforma) throw new HttpError('O campo nome_plataforma é obrigatório');
  const r = await prisma.plataforma.create({ data: { nome_plataforma } });
  return { id_plataforma: r.id_plataforma, nome_plataforma: r.nome_plataforma };
}

async function plataformaRemove(id: number): Promise<boolean> {
  try { await prisma.plataforma.delete({ where: { id_plataforma: id } }); return true; } catch (e) { throw new HttpError('plataforma não encontrado', 404); }
}

export const Genero     = { readAll: generoReadAll, readById: generoReadById, create: generoCreate, remove: generoRemove };
export const Plataforma = { readAll: plataformaReadAll, readById: plataformaReadById, create: plataformaCreate, remove: plataformaRemove };
