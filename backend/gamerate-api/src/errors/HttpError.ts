/**
 * errors/HttpError.ts — Classe padronizada para erros HTTP
 */

export class HttpError extends Error {
  public readonly status: number;
  public readonly message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
    };
  }
}

export function notFound(message: string = 'Recurso não encontrado'): HttpError {
  return new HttpError(404, message);
}

export function badRequest(message: string = 'Requisição inválida'): HttpError {
  return new HttpError(400, message);
}

export function unauthorized(message: string = 'Não autorizado'): HttpError {
  return new HttpError(401, message);
}

export function forbidden(message: string = 'Acesso negado'): HttpError {
  return new HttpError(403, message);
}

export function conflict(message: string = 'Conflito'): HttpError {
  return new HttpError(409, message);
}

export function internalServerError(message: string = 'Erro interno no servidor'): HttpError {
  return new HttpError(500, message);
}
