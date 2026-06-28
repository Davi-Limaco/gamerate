import { prisma } from '@/database/prisma.ts';
import type { Jogo, JogoInput, JogoResumo, JogoFilter } from '@/types/Jogo.d.ts';
import type { Genero } from '@/types/Genero.d.ts';
import type { Plataforma } from '@/types/Plataforma.d.ts';
import HttpError from '@/errors/HttpError.ts';

function dateToString(d?: Date | null) { if (!d) return undefined; return d.toISOString().split('T')[0]; }

async function readAll(filter?: JogoFilter): Promise<JogoResumo[]> {
  const where: any = {};
  if (filter?.search) where.nome_jogo = { contains: filter.search, mode: 'insensitive' };
  if (filter?.genero) where.jogo_genero = { some: { genero: { nome_genero: filter.genero } } };
  if (filter?.plataforma) where.jogo_plataforma = { some: { plataforma: { nome_plataforma: filter.plataforma } } };

  const rows = await prisma.jogo.findMany({ where, orderBy: { nome_jogo: 'asc' }, select: { id_jogo: true, nome_jogo: true, desenvolvedora: true, data_lancamento: true, nota_media: true, total_avaliacoes: true, capa: true } });
  return rows.map(r => ({ id_jogo: r.id_jogo, nome_jogo: r.nome_jogo, desenvolvedora: r.desenvolvedora, data_lancamento: dateToString(r.data_lancamento)!, nota_media: r.nota_media ?? null, total_avaliacoes: r.total_avaliacoes ?? 0, capa: r.capa ?? null }));
}

async function readById(id: number): Promise<Jogo> {
  const r = await prisma.jogo.findUnique({ where: { id_jogo: id }, include: { jogo_genero: { include: { genero: true } }, jogo_plataforma: { include: { plataforma: true } } } });
  if (!r) throw new HttpError('Jogo não encontrado', 404);

  const generos: Genero[] = r.jogo_genero.map(jg => ({ id_genero: jg.genero.id_genero, nome_genero: jg.genero.nome_genero }));
  const plataformas: Plataforma[] = r.jogo_plataforma.map(jp => ({ id_plataforma: jp.plataforma.id_plataforma, nome_plataforma: jp.plataforma.nome_plataforma }));

  return {
    id_jogo: r.id_jogo,
    nome_jogo: r.nome_jogo,
    desenvolvedora: r.desenvolvedora,
    data_lancamento: dateToString(r.data_lancamento)!,
    descricao: r.descricao,
    nota_media: r.nota_media ?? null,
    total_avaliacoes: r.total_avaliacoes ?? 0,
    capa: r.capa ?? null,
    generos,
    plataformas,
  };
}

async function create({ nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos = [], plataformas = [] }: JogoInput): Promise<Jogo> {
  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
    throw new HttpError('Campos obrigatórios: nome_jogo, desenvolvedora, data_lancamento, descricao');
  }

  const jogo = await prisma.jogo.create({ data: { nome_jogo, desenvolvedora, data_lancamento: new Date(data_lancamento as string), descricao, nota_media: null, total_avaliacoes: 0, capa: capa ?? null } });

  if (generos.length) {
    await prisma.jogoGenero.createMany({ data: generos.map(gId => ({ id_jogo_fk: jogo.id_jogo, id_genero_fk: gId })), skipDuplicates: true });
  }

  if (plataformas.length) {
    await prisma.jogoPlataforma.createMany({ data: plataformas.map(pId => ({ id_jogo_fk: jogo.id_jogo, id_plataforma_fk: pId })), skipDuplicates: true });
  }

  return readById(jogo.id_jogo);
}

async function update({ id, nome_jogo, desenvolvedora, data_lancamento, descricao, capa }: JogoInput & { id?: number }): Promise<Jogo> {
  if (!id || !nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
    throw new HttpError('Campos obrigatórios: id, nome_jogo, desenvolvedora, data_lancamento, descricao');
  }

  try {
    await prisma.jogo.update({ where: { id_jogo: id }, data: { nome_jogo, desenvolvedora, data_lancamento: new Date(data_lancamento as string), descricao, capa: capa ?? null } });
    return readById(id);
  } catch (e) {
    throw new HttpError('Jogo não encontrado', 404);
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.jogoGenero.deleteMany({ where: { id_jogo_fk: id } });
    await prisma.jogoPlataforma.deleteMany({ where: { id_jogo_fk: id } });
    await prisma.jogo.delete({ where: { id_jogo: id } });
    return true;
  } catch (e) {
    throw new HttpError('Jogo não encontrado', 404);
  }
}

async function atualizarNota(id: number): Promise<void> {
  const agg = await prisma.avaliacao.aggregate({ where: { id_jogo_fk: id }, _avg: { nota: true }, _count: { _all: true } });
  const media = agg._avg.nota ?? null;
  const total = agg._count._all ?? 0;
  await prisma.jogo.update({ where: { id_jogo: id }, data: { nota_media: media, total_avaliacoes: total } });
}

async function getStats() {
  const total_jogos = await prisma.jogo.count();
  const total_aval = await prisma.avaliacao.count();
  const total_usuarios = await prisma.usuario.count();
  const total_plat = await prisma.plataforma.count();

  return { total_jogos, total_aval, total_usuarios, total_plat };
}

async function getDestaques() {
  const lancamentos = await prisma.jogo.findMany({ orderBy: { data_lancamento: 'desc' }, take: 8, select: { id_jogo: true, nome_jogo: true, desenvolvedora: true, data_lancamento: true, nota_media: true, total_avaliacoes: true, capa: true } });
  const melhores = await prisma.jogo.findMany({ where: { nota_media: { not: null } }, orderBy: { nota_media: 'desc' }, take: 8, select: { id_jogo: true, nome_jogo: true, desenvolvedora: true, data_lancamento: true, nota_media: true, total_avaliacoes: true, capa: true } });

  return {
    lancamentos: lancamentos.map(r => ({ id_jogo: r.id_jogo, nome_jogo: r.nome_jogo, desenvolvedora: r.desenvolvedora, data_lancamento: dateToString(r.data_lancamento)!, nota_media: r.nota_media ?? null, total_avaliacoes: r.total_avaliacoes ?? 0, capa: r.capa ?? null })),
    melhores: melhores.map(r => ({ id_jogo: r.id_jogo, nome_jogo: r.nome_jogo, desenvolvedora: r.desenvolvedora, data_lancamento: dateToString(r.data_lancamento)!, nota_media: r.nota_media ?? null, total_avaliacoes: r.total_avaliacoes ?? 0, capa: r.capa ?? null })),
  };
}

export default { readAll, readById, create, update, remove, atualizarNota, getStats, getDestaques };
