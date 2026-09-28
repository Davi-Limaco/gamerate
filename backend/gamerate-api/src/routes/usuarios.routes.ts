import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { authorize } from '@/middlewares/authorize.ts';
import { requireOwnerOrAdmin } from '@/middlewares/requireOwnerOrAdmin.ts';
import UsuariosController from '@/controllers/usuarios.controller.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { usuarioBodySchema, usuarioUpdateBodySchema, usuarioPerfilBodySchema } from '@/schemas/usuario.schema.ts';

const router = Router();

// Listagem geral de usuários: dado sensível (e-mails e perfis de todo mundo),
// restrita a administradores (usada pelo painel admin.html).
router.get('/usuarios', authenticate, authorize('Administrador'), UsuariosController.read);

// Consulta/edição/remoção de um usuário específico: o próprio dono do
// recurso ou um administrador — nunca um terceiro qualquer. `authenticate`
// identifica quem faz a requisição (401 se não houver token válido);
// `requireOwnerOrAdmin` decide se esse usuário pode agir sobre ESSE :id
// específico (403 caso contrário).
router.get('/usuarios/:id', authenticate, validate({ params: idParamSchema }), requireOwnerOrAdmin, UsuariosController.readById);
router.get('/usuarios/:id/avaliacoes', authenticate, validate({ params: idParamSchema }), requireOwnerOrAdmin, UsuariosController.readAvaliacoes);
router.put('/usuarios/:id', authenticate, requireJson, validate({ params: idParamSchema, body: usuarioUpdateBodySchema }), requireOwnerOrAdmin, UsuariosController.update);
router.delete('/usuarios/:id', authenticate, validate({ params: idParamSchema }), requireOwnerOrAdmin, UsuariosController.remove);

// Criação direta de usuário com perfil arbitrário e troca de perfil/role:
// apenas administradores. Cadastro público de conta comum é feito por
// POST /auth/cadastro (auth.routes.ts), que sempre atribui o perfil padrão.
router.post('/usuarios', authenticate, authorize('Administrador'), requireJson, validate({ body: usuarioBodySchema }), UsuariosController.create);
router.put('/usuarios/:id/perfil', authenticate, authorize('Administrador'), requireJson, validate({ params: idParamSchema, body: usuarioPerfilBodySchema }), UsuariosController.updatePerfil);

export default router;
