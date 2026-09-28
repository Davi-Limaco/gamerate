import { prisma } from '@/database/prisma.ts';
import type { Contato, ContatoInput } from '@/types/Contato.d.ts';
import HttpError from '@/errors/HttpError.ts';
import { sendMail } from '@/services/sendMail.ts';

function dateToString(d?: Date | null) { if (!d) return undefined; return d.toISOString().split('T')[0]; }

async function readAll(): Promise<Contato[]> {
  const rows = await prisma.comunicacao_site.findMany({ orderBy: { data_comunicacao: 'desc' } });
  return rows.map(r => ({ id_comunicacao: r.id_comunicacao, email_contato: r.email_contato, tipo: r.tipo, mensagem: r.mensagem, data_comunicacao: dateToString(r.data_comunicacao)! }));
}

async function readById(id: number): Promise<Contato> {
  const r = await prisma.comunicacao_site.findUnique({ where: { id_comunicacao: id } });
  if (!r) throw new HttpError('Contato não encontrado', 404);
  return { id_comunicacao: r.id_comunicacao, email_contato: r.email_contato, tipo: r.tipo, mensagem: r.mensagem, data_comunicacao: dateToString(r.data_comunicacao)! };
}

async function create({ email_contato, tipo, mensagem }: ContatoInput): Promise<Contato> {
  if (!email_contato || !tipo || !mensagem) throw new HttpError('Campos obrigatórios: email_contato, tipo, mensagem');

  const r = await prisma.comunicacao_site.create({ data: { email_contato, tipo, mensagem } });

  await sendMail({
    to: 'admin@gamerate.com',
    subject: `Contato do site: ${tipo}`,
    text: `Email: ${email_contato}\n\nTipo: ${tipo}\n\nMensagem:\n${mensagem}`,
    html: `
      <h3>Nova mensagem de contato</h3>
      <p><strong>Email:</strong> ${email_contato}</p>
      <p><strong>Tipo:</strong> ${tipo}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${mensagem.replace(/\n/g, '<br>')}</p>
    `,
  });

  return { id_comunicacao: r.id_comunicacao, email_contato: r.email_contato, tipo: r.tipo, mensagem: r.mensagem, data_comunicacao: dateToString(r.data_comunicacao)! };
}

async function remove(id: number): Promise<boolean> {
  try { await prisma.comunicacao_site.delete({ where: { id_comunicacao: id } }); return true; } catch (e) { throw new HttpError('Contato não encontrado', 404); }
}

export default { readAll, readById, create, remove };
