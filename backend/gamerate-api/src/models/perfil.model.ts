import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import type { Perfil, PerfilInput } from '@/types/Perfil.d.ts';

async function readAll(): Promise<Perfil[]> {
  return prisma.perfil.findMany({ orderBy: { id_perfil: 'asc' } });
}

async function readById(id: number): Promise<Perfil> {
  const perfil = await prisma.perfil.findUnique({ where: { id_perfil: id } });
  if (!perfil) throw new HttpError('Perfil não encontrado', 404);
  return perfil;
}

async function create(input: PerfilInput): Promise<Perfil> {
  try {
    return await prisma.perfil.create({ data: { nome_perfil: input.nome_perfil! } });
  } catch (error) {
    throwPrismaError(error, 'Perfil');
  }
}

async function update(input: PerfilInput & { id?: number }): Promise<Perfil> {
  if (input.id === undefined) throw new HttpError('ID do perfil inválido', 400);
  try {
    return await prisma.perfil.update({ where: { id_perfil: input.id }, data: { nome_perfil: input.nome_perfil! } });
  } catch (error) {
    throwPrismaError(error, 'Perfil');
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.perfil.delete({ where: { id_perfil: id } });
    return true;
  } catch (error) {
    throwPrismaError(error, 'Perfil');
  }
}

export default { readAll, readById, create, update, remove };
