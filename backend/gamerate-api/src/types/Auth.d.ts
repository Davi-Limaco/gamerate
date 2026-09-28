/** Dados embutidos no token JWT — usados pelo middleware `authenticate`. */
export interface AuthTokenPayload {
  /** id_usuario do titular do token. */
  sub: number;
  /** nome_perfil no momento da emissão do token (usado pelo `authorize`). */
  perfil: string;
}

/** Formato do usuário autenticado, disponível em `req.usuario` após `authenticate`. */
export interface AuthenticatedUser {
  id: number;
  perfil: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware `authenticate`; ausente em rotas públicas. */
      usuario?: AuthenticatedUser;
    }
  }
}

export {};
