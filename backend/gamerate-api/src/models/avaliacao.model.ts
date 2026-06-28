import { prisma } from '@/database/prisma.ts';
import type { Avaliacao, AvaliacaoInput, AvaliacaoFilter } from '@/types/Avaliacao.d.ts';
import HttpError from '@/errors/HttpError.ts';
import Jogo from '@/models/jogo.model.ts';

function dateToString(d?: Date | null) { if (!d) return undefined; return d.toISOString().split('T')[0]; }

async function readAll(filter?: AvaliacaoFilter): Promise<Avaliacao[]> {
  const where = filter?.jogo_id ? { id_jogo_fk: filter.jogo_id } : undefined;
  const rows = await prisma.avaliacao.findMany({ where, include: { usuario: { select: { id_usuario: true, nome_usuario: true } }, jogo: { select: { id_jogo: true, nome_jogo: true, capa: true } } }, orderBy: { data_publicacao: 'desc' } });
  return rows.map(r => ({ id_avaliacao: r.id_avaliacao, id_usuario_fk: r.id_usuario_fk, id_jogo_fk: r.id_jogo_fk, nota: r.nota, titulo: r.titulo, texto: r.texto, data_publicacao: dateToString(r.data_publicacao)!, nome_usuario: r.usuario?.nome_usuario, nome_jogo: r.jogo?.nome_jogo, capa: r.jogo?.capa ?? null, id_usuario: r.usuario?.id_usuario, id_jogo: r.jogo?.id_jogo }));
}

async function readById(id: number): Promise<Avaliacao> {
  const r = await prisma.avaliacao.findUnique({ where: { id_avaliacao: id }, include: { usuario: { select: { nome_usuario: true, id_usuario: true } }, jogo: { select: { nome_jogo: true, capa: true, id_jogo: true } } } });
  if (!r) throw new HttpError('Avaliação não encontrada', 404);
  return { id_avaliacao: r.id_avaliacao, id_usuario_fk: r.id_usuario_fk, id_jogo_fk: r.id_jogo_fk, nota: r.nota, titulo: r.titulo, texto: r.texto, data_publicacao: dateToString(r.data_publicacao)!, nome_usuario: r.usuario?.nome_usuario, nome_jogo: r.jogo?.nome_jogo, capa: r.jogo?.capa ?? null, id_usuario: r.usuario?.id_usuario, id_jogo: r.jogo?.id_jogo };
}

async function create({ id_usuario_fk, id_jogo_fk, nota, titulo, texto }: AvaliacaoInput): Promise<Avaliacao> {
  if (!id_usuario_fk || !id_jogo_fk || nota === undefined || !titulo || !texto) {
    throw new HttpError('Campos obrigatórios: id_usuario_fk, id_jogo_fk, nota, titulo, texto');
  }

  const notaNum = parseFloat(String(nota));
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    throw new HttpError('A nota deve ser um número entre 1 e 5');
  }

  const exists = await prisma.avaliacao.findFirst({ where: { id_usuario_fk, id_jogo_fk } });
  if (exists) throw new HttpError('Você já avaliou este jogo', 409);

  const r = await prisma.avaliacao.create({ data: { id_usuario_fk, id_jogo_fk, nota: notaNum, titulo, texto } });
  await Jogo.atualizarNota(id_jogo_fk);
  return readById(r.id_avaliacao);
}

async function update({ id, nota, titulo, texto }: AvaliacaoInput & { id?: number }): Promise<Avaliacao> {
  if (!id || nota === undefined || !titulo || !texto) {
    throw new HttpError('Campos obrigatórios: nota, titulo, texto');
  }

  const notaNum = parseFloat(String(nota));
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    throw new HttpError('A nota deve ser um número entre 1 e 5');
  }

  try {
    await prisma.avaliacao.update({ where: { id_avaliacao: id }, data: { nota: notaNum, titulo, texto } });
    const av = await readById(id);
    await Jogo.atualizarNota(av.id_jogo_fk);
    return av;
  } catch (e) {
    throw new HttpError('Avaliação não encontrada', 404);
  }
}

async function remove(id: number): Promise<boolean> {
  const av = await readById(id);
  try {
    await prisma.avaliacao.delete({ where: { id_avaliacao: id } });
    await Jogo.atualizarNota(av.id_jogo_fk);
    return true;
  } catch (e) {
    throw new HttpError('Avaliação não encontrada', 404);
  }
}

async function getDestaque(): Promise<Avaliacao[]> {
  const rows = await prisma.avaliacao.findMany({ include: { usuario: { select: { id_usuario: true, nome_usuario: true } }, jogo: { select: { id_jogo: true, nome_jogo: true, capa: true } } }, orderBy: [{ nota: 'desc' }, { data_publicacao: 'desc' }], take: 6 });
  return rows.map(r => ({ id_avaliacao: r.id_avaliacao, id_usuario_fk: r.id_usuario_fk, id_jogo_fk: r.id_jogo_fk, nota: r.nota, titulo: r.titulo, texto: r.texto, data_publicacao: dateToString(r.data_publicacao)!, nome_usuario: r.usuario?.nome_usuario, nome_jogo: r.jogo?.nome_jogo, capa: r.jogo?.capa ?? null, id_usuario: r.usuario?.id_usuario, id_jogo: r.jogo?.id_jogo }));
}

export default { readAll, readById, create, update, remove, getDestaque };
