import type { Contato, ContatoInput } from '@/types/Contato.d.ts';
import HttpError from '@/errors/HttpError.ts';
import { throwPrismaError } from '@/errors/prismaErrors.ts';
import prisma from '@/database/prisma.ts';
import { toDateOnly } from '@/utils/dates.ts';

async function readAll(): Promise<Contato[]> {
  const rows = await prisma.comunicacaoSite.findMany({ orderBy: { data_comunicacao: 'desc' } });
  return rows.map((row) => ({ ...row, data_comunicacao: toDateOnly(row.data_comunicacao) }));
}

async function readById(id: number): Promise<Contato> {
  const contato = await prisma.comunicacaoSite.findUnique({ where: { id_comunicacao: id } });
  if (contato) return mapContato(contato);
  throw new HttpError('Contato não encontrado', 404);
}

async function create({ email_contato, tipo, mensagem }: ContatoInput): Promise<Contato> {
  try {
    const contato = await prisma.comunicacaoSite.create({
      data: { email_contato: email_contato!, tipo: tipo!, mensagem: mensagem!, data_comunicacao: new Date() },
    });
    return { ...contato, data_comunicacao: toDateOnly(contato.data_comunicacao) };
  } catch (error) {
    throwPrismaError(error, 'Contato');
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    await prisma.comunicacaoSite.delete({ where: { id_comunicacao: id } });
    return true;
  } catch (error) {
    throwPrismaError(error, 'Contato');
  }
}

function mapContato(contato: { id_comunicacao: number; email_contato: string; tipo: string; mensagem: string; data_comunicacao: Date }): Contato {
  return { ...contato, data_comunicacao: toDateOnly(contato.data_comunicacao) };
}

export default { readAll, readById, create, remove };
