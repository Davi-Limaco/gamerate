import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import { toDateOnly } from '@/utils/dates.ts';
import type { Favorito } from '@/types/Favorito.d.ts';

const include = {
  jogo: { select: { id_jogo: true, nome_jogo: true, capa: true, desenvolvedora: true, nota_media: true } },
} as const;

function mapFavorito(row: {
  id_favorito: number;
  data_criacao: Date;
  jogo: { id_jogo: number; nome_jogo: string; capa: string | null; desenvolvedora: string; nota_media: number | null };
}): Favorito {
  return {
    id_favorito: row.id_favorito,
    id_jogo: row.jogo.id_jogo,
    nome_jogo: row.jogo.nome_jogo,
    capa: row.jogo.capa,
    desenvolvedora: row.jogo.desenvolvedora,
    nota_media: row.jogo.nota_media,
    data_criacao: toDateOnly(row.data_criacao),
  };
}

async function readByUsuario(idUsuario: number): Promise<Favorito[]> {
  const rows = await prisma.favorito.findMany({
    where: { id_usuario_fk: idUsuario },
    orderBy: { data_criacao: 'desc' },
    include,
  });
  return rows.map(mapFavorito);
}

/** 404 se o jogo não existe; 409 (chave única) se já estava nos favoritos. */
async function create(idUsuario: number, idJogo: number): Promise<Favorito> {
  const jogo = await prisma.jogo.findUnique({ where: { id_jogo: idJogo }, select: { id_jogo: true } });
  if (!jogo) throw new HttpError('Jogo não encontrado', 404);

  try {
    const row = await prisma.favorito.create({
      data: { id_usuario_fk: idUsuario, id_jogo_fk: idJogo },
      include,
    });
    return mapFavorito(row);
  } catch (error) {
    throwPrismaError(error, 'Favorito');
  }
}

async function remove(idUsuario: number, idJogo: number): Promise<void> {
  const { count } = await prisma.favorito.deleteMany({ where: { id_usuario_fk: idUsuario, id_jogo_fk: idJogo } });
  if (count === 0) throw new HttpError('Este jogo não está nos seus favoritos', 404);
}

export default { readByUsuario, create, remove };
