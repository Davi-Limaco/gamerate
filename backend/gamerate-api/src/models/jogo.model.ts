import { Prisma } from '@prisma/client';

import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import { fromDateOnly, toDateOnly } from '@/utils/dates.ts';
import type { Jogo, JogoFilter, JogoInput, JogoResumo } from '@/types/Jogo.d.ts';

const resumoSelect = {
  id_jogo: true,
  nome_jogo: true,
  desenvolvedora: true,
  data_lancamento: true,
  nota_media: true,
  total_avaliacoes: true,
  capa: true,
} satisfies Prisma.JogoSelect;

type JogoResumoRecord = Prisma.JogoGetPayload<{ select: typeof resumoSelect }>;

function mapResumo(jogo: JogoResumoRecord): JogoResumo {
  return { ...jogo, data_lancamento: toDateOnly(jogo.data_lancamento) };
}

async function readAll(filter: JogoFilter = {}): Promise<JogoResumo[]> {
  const jogos = await prisma.jogo.findMany({
    where: {
      ...(filter.search ? { nome_jogo: { contains: filter.search } } : {}),
      ...(filter.genero ? { generos: { some: { genero: { nome_genero: filter.genero } } } } : {}),
      ...(filter.plataforma ? { plataformas: { some: { plataforma: { nome_plataforma: filter.plataforma } } } } : {}),
    },
    orderBy: { nome_jogo: 'asc' },
    select: resumoSelect,
  });

  return jogos.map(mapResumo);
}

async function readById(id: number): Promise<Jogo> {
  const jogo = await prisma.jogo.findUnique({
    where: { id_jogo: id },
    include: {
      generos: { include: { genero: true } },
      plataformas: { include: { plataforma: true } },
    },
  });

  if (!jogo) throw new HttpError('Jogo não encontrado', 404);

  return {
    id_jogo: jogo.id_jogo,
    nome_jogo: jogo.nome_jogo,
    desenvolvedora: jogo.desenvolvedora,
    data_lancamento: toDateOnly(jogo.data_lancamento),
    descricao: jogo.descricao,
    nota_media: jogo.nota_media,
    total_avaliacoes: jogo.total_avaliacoes,
    capa: jogo.capa,
    generos: jogo.generos.map(({ genero }) => genero),
    plataformas: jogo.plataformas.map(({ plataforma }) => plataforma),
  };
}

async function create(input: JogoInput): Promise<Jogo> {
  const { generos = [], plataformas = [], ...fields } = input;

  try {
    const jogo = await prisma.jogo.create({
      data: {
        nome_jogo: fields.nome_jogo!,
        desenvolvedora: fields.desenvolvedora!,
        data_lancamento: fromDateOnly(fields.data_lancamento!),
        descricao: fields.descricao!,
        capa: fields.capa ?? null,
        generos: { create: generos.map((id_genero) => ({ genero: { connect: { id_genero } } })) },
        plataformas: { create: plataformas.map((id_plataforma) => ({ plataforma: { connect: { id_plataforma } } })) },
      },
    });

    return readById(jogo.id_jogo);
  } catch (error) {
    throwPrismaError(error, 'Jogo');
  }
}

async function update(input: JogoInput & { id?: number }): Promise<Jogo> {
  const { id, generos, plataformas, ...fields } = input;
  if (id === undefined) throw new HttpError('ID do jogo inválido', 400);

  const data: Prisma.JogoUpdateInput = {};
  if (fields.nome_jogo !== undefined) data.nome_jogo = fields.nome_jogo;
  if (fields.desenvolvedora !== undefined) data.desenvolvedora = fields.desenvolvedora;
  if (fields.data_lancamento !== undefined) data.data_lancamento = fromDateOnly(fields.data_lancamento);
  if (fields.descricao !== undefined) data.descricao = fields.descricao;
  if (fields.capa !== undefined) data.capa = fields.capa;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.jogo.update({ where: { id_jogo: id }, data });
      if (generos !== undefined) {
        await tx.jogoGenero.deleteMany({ where: { id_jogo_fk: id } });
        if (generos.length) await tx.jogoGenero.createMany({ data: generos.map((id_genero) => ({ id_jogo_fk: id, id_genero_fk: id_genero })) });
      }
      if (plataformas !== undefined) {
        await tx.jogoPlataforma.deleteMany({ where: { id_jogo_fk: id } });
        if (plataformas.length) await tx.jogoPlataforma.createMany({ data: plataformas.map((id_plataforma) => ({ id_jogo_fk: id, id_plataforma_fk: id_plataforma })) });
      }
    });

    return readById(id);
  } catch (error) {
    throwPrismaError(error, 'Jogo');
  }
}

async function remove(id: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const jogo = await tx.jogo.findUnique({ where: { id_jogo: id }, select: { id_jogo: true } });
    if (!jogo) throw new HttpError('Jogo não encontrado', 404);

    if (await tx.avaliacao.count({ where: { id_jogo_fk: id } })) {
      throw new HttpError('Exclua as avaliações deste jogo antes de removê-lo', 409);
    }

    await tx.jogoGenero.deleteMany({ where: { id_jogo_fk: id } });
    await tx.jogoPlataforma.deleteMany({ where: { id_jogo_fk: id } });
    await tx.jogo.delete({ where: { id_jogo: id } });
    return true;
  });
}

async function atualizarNota(id: number): Promise<void> {
  const aggregate = await prisma.avaliacao.aggregate({
    where: { id_jogo_fk: id },
    _avg: { nota: true },
    _count: { _all: true },
  });

  await prisma.jogo.update({
    where: { id_jogo: id },
    data: { nota_media: aggregate._avg.nota, total_avaliacoes: aggregate._count._all },
  });
}

async function getStats() {
  const [total_jogos, total_aval, total_usuarios, total_plat] = await Promise.all([
    prisma.jogo.count(),
    prisma.avaliacao.count(),
    prisma.usuario.count(),
    prisma.plataforma.count(),
  ]);

  return { total_jogos, total_aval, total_usuarios, total_plat };
}

async function getDestaques() {
  const [lancamentos, melhores] = await Promise.all([
    prisma.jogo.findMany({ orderBy: { data_lancamento: 'desc' }, take: 8, select: resumoSelect }),
    prisma.jogo.findMany({ where: { nota_media: { not: null } }, orderBy: { nota_media: 'desc' }, take: 8, select: resumoSelect }),
  ]);

  return { lancamentos: lancamentos.map(mapResumo), melhores: melhores.map(mapResumo) };
}

export default { readAll, readById, create, update, remove, atualizarNota, getStats, getDestaques };
