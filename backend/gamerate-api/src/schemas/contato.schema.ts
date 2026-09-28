import { z } from 'zod';

export const contatoBodySchema = z.object({
  email_contato: z.string({ required_error: 'email_contato é obrigatório' })
    .email('email_contato deve ter um formato válido'),
  tipo: z.string({ required_error: 'tipo é obrigatório' }).min(1, 'tipo é obrigatório'),
  mensagem: z.string({ required_error: 'mensagem é obrigatória' })
    .min(10, 'mensagem deve ter no mínimo 10 caracteres')
    .max(2000, 'mensagem deve ter no máximo 2000 caracteres'),
});
