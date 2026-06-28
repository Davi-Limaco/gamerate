import { prisma } from '@/database/prisma.ts';
import type { Perfil, PerfilInput } from '@/types/Perfil.d.ts';
import HttpError from '@/errors/HttpError.ts';

async function readAll(): Promise<Perfil[]> {
  return prisma.perfil.findMany({ orderBy: { id_perfil: 'asc' } });
}

async function readById(id: number): Promise<Perfil> {
  const perfil = await prisma.perfil.findUnique({ where: { id_perfil: id } });
  if (!perfil) throw new HttpError('Perfil não encontrado', 404);
  return perfil;
}

async function create({ nome_perfil }: PerfilInput): Promise<Perfil> {
  if (!nome_perfil) throw new HttpError('O campo nome_perfil é obrigatório');
  return prisma.perfil.create({ data: { nome_perfil } });
}

async function update({ id, nome_perfil }: PerfilInput & { id?: number }): Promise<Perfil> {
  if (!id || !nome_perfil) throw new HttpError('Os campos id e nome_perfil são obrigatórios');
  try {
    return await prisma.perfil.update({ where: { id_perfil: id }, data: { nome_perfil } });
  } catch (e) {
    throw new HttpError('Perfil não encontrado', 404);
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.perfil.delete({ where: { id_perfil: id } });
    return true;
  } catch (e) {
    throw new HttpError('Perfil não encontrado', 404);
  }
}

export default { readAll, readById, create, update, remove };
