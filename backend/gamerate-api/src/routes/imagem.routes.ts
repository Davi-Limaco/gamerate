import { Router } from 'express';

import ImagemController from '@/controllers/imagem.controller.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { uploadAvatar } from '@/middlewares/upload.ts';

const router = Router();

// Ordem importa: `authenticate` ANTES de `uploadAvatar`. Sem token válido a
// requisição é encerrada com 401 e o Multer nem chega a ler o corpo
// multipart — nenhum arquivo é processado nem gravado.
//
// Estas rotas precisam ser registradas ANTES de usuarios.routes.ts (ver
// index.ts), senão `/usuarios/imagem` seria interpretado como `/usuarios/:id`.
router.post('/usuarios/imagem', authenticate, uploadAvatar, ImagemController.create);
router.put('/usuarios/imagem', authenticate, uploadAvatar, ImagemController.update);
router.delete('/usuarios/imagem', authenticate, ImagemController.remove);

export default router;
