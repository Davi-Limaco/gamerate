import type { Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';
import Imagem from '@/models/imagem.model.ts';
import { removeAvatarByPublicPath, removeFileQuietly, toPublicAvatarPath } from '@/utils/uploads.ts';

/**
 * Salva a foto enviada (já validada e gravada em disco pelo Multer) e a
 * associa ao usuário DO TOKEN — o id nunca vem do cliente.
 *
 *  - sucesso: o arquivo antigo (se havia) é removido do disco;
 *  - falha no banco: o arquivo recém-gravado é removido (sem órfãos).
 */
async function salvar(req: Request, res: Response<unknown>, status: 200 | 201) {
  // Garantidos pelos middlewares anteriores (authenticate + uploadAvatar).
  const file = req.file!;
  const idUsuario = req.usuario!.id;

  try {
    const caminho = toPublicAvatarPath(file.filename);
    const { imagem, caminhoAnterior } = await Imagem.upsertByUsuario(idUsuario, caminho);

    if (caminhoAnterior && caminhoAnterior !== caminho) {
      await removeAvatarByPublicPath(caminhoAnterior);
    }

    res.status(status).json({ imagem, caminho: imagem.caminho });
  } catch (error) {
    await removeFileQuietly(file.path);
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao salvar imagem', 500);
  }
}

/** POST /usuarios/imagem — envia a foto de perfil (201 + caminho público). */
async function create(req: Request, res: Response<unknown>) {
  await salvar(req, res, 201);
}

/** PUT /usuarios/imagem — substitui a foto de perfil (200 + novo caminho). */
async function update(req: Request, res: Response<unknown>) {
  await salvar(req, res, 200);
}

/** DELETE /usuarios/imagem — remove a foto de perfil do usuário autenticado. */
async function remove(req: Request, res: Response<unknown>) {
  try {
    const caminho = await Imagem.removeByUsuario(req.usuario!.id);
    if (!caminho) throw new HttpError('Você não possui foto de perfil', 404);
    await removeAvatarByPublicPath(caminho);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover imagem', 500);
  }
}

export default { create, update, remove };
