import { Prisma } from '@prisma/client';

import HttpError from '@/errors/HttpError.ts';

export function throwPrismaError(error: unknown, entity: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') throw new HttpError(`${entity} já cadastrado`, 409);
    if (error.code === 'P2025') throw new HttpError(`${entity} não encontrado`, 404);
    if (error.code === 'P2003') throw new HttpError('Referência a registro inexistente', 400);
    if (error.code === 'P2014') throw new HttpError('Operação viola um relacionamento obrigatório', 409);
  }

  throw error;
}
