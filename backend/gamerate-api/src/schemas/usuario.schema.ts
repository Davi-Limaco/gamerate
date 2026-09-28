import { z } from 'zod';

export const usuarioBodySchema = z.object({
  nome_usuario: z.string({ required_error: 'nome_usuario é obrigatório' })
    .min(3, 'nome_usuario deve ter no mínimo 3 caracteres')
    .max(150, 'nome_usuario deve ter no máximo 150 caracteres'),
  email: z.string({ required_error: 'email é obrigatório' })
    .email('email deve ter um formato válido'),
  senha: z.string({ required_error: 'senha é obrigatória' })
    .min(6, 'senha deve ter no mínimo 6 caracteres')
    .max(200, 'senha deve ter no máximo 200 caracteres'),
  id_perfil_fk: z.coerce.number().int().positive().optional(),
});

// Cadastro (fluxo público) usa as mesmas regras do usuário — sem id_perfil_fk,
// que é decidido pelo backend (perfil padrão).
export const cadastroBodySchema = usuarioBodySchema.omit({ id_perfil_fk: true });

export const loginBodySchema = z.object({
  email: z.string({ required_error: 'email é obrigatório' }).email('email deve ter um formato válido'),
  senha: z.string({ required_error: 'senha é obrigatória' }).min(1, 'senha é obrigatória'),
});

// Atualização: todos os campos são opcionais, mas se enviados devem ser válidos.
export const usuarioUpdateBodySchema = usuarioBodySchema
  .omit({ id_perfil_fk: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie ao menos um campo para atualizar' });

export const usuarioPerfilBodySchema = z.object({
  id_perfil_fk: z.coerce.number({ required_error: 'id_perfil_fk é obrigatório' }).int().positive(),
});
