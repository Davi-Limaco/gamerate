import prisma from '@/database/prisma.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import type { Imagem } from '@/types/Imagem.d.ts';

function mapImagem(row: { id_imagem: number; caminho: string; id_usuario_fk: number; data_envio: Date }): Imagem {
  return {
    id_imagem: row.id_imagem,
    caminho: row.caminho,
    id_usuario_fk: row.id_usuario_fk,
    data_envio: row.data_envio.toISOString(),
  };
}

/**
 * Regra "um arquivo por usuário": `upsert` pela chave única `id_usuario_fk`.
 * Primeiro envio -> INSERT; envios seguintes -> UPDATE do caminho no MESMO
 * registro (nunca um segundo). Devolve também o caminho anterior para o
 * Controller apagar o arquivo antigo do disco.
 */
async function upsertByUsuario(idUsuario: number, caminho: string): Promise<{ imagem: Imagem; caminhoAnterior: string | null }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const anterior = await tx.imagem.findUnique({ where: { id_usuario_fk: idUsuario } });
      const row = await tx.imagem.upsert({
        where: { id_usuario_fk: idUsuario },
        create: { id_usuario_fk: idUsuario, caminho },
        update: { caminho, data_envio: new Date() },
      });
      return { imagem: mapImagem(row), caminhoAnterior: anterior?.caminho ?? null };
    });
  } catch (error) {
    throwPrismaError(error, 'Imagem');
  }
}

/** Remove o registro da foto do usuário e devolve o caminho que ele tinha (ou null). */
async function removeByUsuario(idUsuario: number): Promise<string | null> {
  const row = await prisma.imagem.findUnique({ where: { id_usuario_fk: idUsuario } });
  if (!row) return null;
  await prisma.imagem.delete({ where: { id_usuario_fk: idUsuario } });
  return row.caminho;
}

export default { upsertByUsuario, removeByUsuario };
