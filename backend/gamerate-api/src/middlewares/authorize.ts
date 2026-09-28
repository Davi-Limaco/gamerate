import type { NextFunction, Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';

/**
 * Middleware de autorização por perfil (role-based access control).
 *
 * Deve ser usado sempre depois de `authenticate` na cadeia da rota — depende
 * de `req.usuario` já estar preenchido. Recebe a lista de `nome_perfil`
 * aceitos para aquela rota (ex.: `authorize('Administrador')`) e responde
 * 403 Forbidden quando o usuário autenticado tem um perfil fora da lista.
 *
 * A diferença para `authenticate` (401): 401 significa "eu não sei quem você
 * é" (sem token ou token inválido); 403 significa "eu sei quem você é, mas
 * você não tem permissão para isto".
 */
export function authorize(...perfisPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      throw new HttpError('Não autenticado', 401);
    }
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      throw new HttpError('Você não tem permissão para acessar este recurso', 403);
    }
    next();
  };
}
