import { Prisma } from '@prisma/client';

import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import type { Midia, MidiaFilter, MidiaInput, TipoMidia } from '@/types/Midia.d.ts';

const include = {
  usuario: { select: { nome_usuario: true } },
  jogo: { select: { nome_jogo: true } },
} satisfies Prisma.MidiaInclude;

type MidiaRecord = Prisma.MidiaGetPayload<{ include: typeof include }>;

function mapMidia(row: MidiaRecord): Midia {
  return {
    id_midia: row.id_midia,
    tipo: row.tipo as TipoMidia,
    caminho: row.caminho,
    titulo: row.titulo,
    descricao: row.descricao,
    id_usuario_fk: row.id_usuario_fk,
    nome_usuario: row.usuario.nome_usuario,
    id_jogo_fk: row.id_jogo_fk,
    nome_jogo: row.jogo?.nome_jogo ?? null,
    data_envio: row.data_envio.toISOString(),
  };
}

async function readAll(filter: MidiaFilter = {}): Promise<Midia[]> {
  const rows = await prisma.midia.findMany({
    where: {
      ...(filter.tipo ? { tipo: filter.tipo } : {}),
      ...(filter.usuario_id ? { id_usuario_fk: filter.usuario_id } : {}),
      ...(filter.jogo_id ? { id_jogo_fk: filter.jogo_id } : {}),
    },
    orderBy: { data_envio: 'desc' },
    ...(filter.limit ? { take: filter.limit } : {}),
    include,
  });
  return rows.map(mapMidia);
}

async function readById(id: number): Promise<Midia> {
  const row = await prisma.midia.findUnique({ where: { id_midia: id }, include });
  if (!row) throw new HttpError('Mídia não encontrada', 404);
  return mapMidia(row);
}

async function create(idUsuario: number, tipo: TipoMidia, caminho: string, input: MidiaInput): Promise<Midia> {
  if (input.id_jogo_fk !== undefined) {
    const jogo = await prisma.jogo.findUnique({ where: { id_jogo: input.id_jogo_fk }, select: { id_jogo: true } });
    if (!jogo) throw new HttpError('Jogo não encontrado', 404);
  }

  try {
    const row = await prisma.midia.create({
      data: {
        tipo,
        caminho,
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        id_usuario_fk: idUsuario,
        id_jogo_fk: input.id_jogo_fk ?? null,
      },
      include,
    });
    return mapMidia(row);
  } catch (error) {
    throwPrismaError(error, 'Mídia');
  }
}

async function update(id: number, input: Partial<Pick<MidiaInput, 'titulo' | 'descricao'>>): Promise<Midia> {
  try {
    const row = await prisma.midia.update({
      where: { id_midia: id },
      data: {
        ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
      },
      include,
    });
    return mapMidia(row);
  } catch (error) {
    throwPrismaError(error, 'Mídia');
  }
}

/** Remove o registro e devolve o caminho do arquivo, para o Controller apagá-lo do disco. */
async function remove(id: number): Promise<string> {
  try {
    const row = await prisma.midia.delete({ where: { id_midia: id } });
    return row.caminho;
  } catch (error) {
    throwPrismaError(error, 'Mídia');
  }
}

async function readCaminhosByUsuario(idUsuario: number): Promise<string[]> {
  const rows = await prisma.midia.findMany({ where: { id_usuario_fk: idUsuario }, select: { caminho: true } });
  return rows.map((row) => row.caminho);
}

export default { readAll, readById, create, update, remove, readCaminhosByUsuario };
