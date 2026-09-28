import { z } from 'zod';

// id_usuario_fk NÃO faz parte do corpo aceito do cliente: o autor da
// avaliação é sempre o usuário autenticado (req.usuario.id, extraído do JWT
// pelo middleware `authenticate`), nunca um valor enviado na requisição —
// caso contrário, qualquer pessoa poderia publicar uma avaliação em nome de
// outro usuário só informando um id_usuario_fk diferente no corpo.
export const avaliacaoBodySchema = z.object({
  id_jogo_fk: z.coerce.number({ required_error: 'id_jogo_fk é obrigatório' }).int().positive(),
  nota: z.coerce.number({ required_error: 'nota é obrigatória' })
    .positive('nota deve ser um valor positivo')
    .max(5, 'nota deve ser no máximo 5'),
  titulo: z.string({ required_error: 'titulo é obrigatório' })
    .min(3, 'titulo deve ter no mínimo 3 caracteres')
    .max(200, 'titulo deve ter no máximo 200 caracteres'),
  texto: z.string({ required_error: 'texto é obrigatório' })
    .min(1, 'texto é obrigatório')
    .max(2000, 'texto deve ter no máximo 2000 caracteres'),
});

// Atualização não permite trocar o autor/jogo da avaliação, só nota/titulo/texto.
export const avaliacaoUpdateBodySchema = avaliacaoBodySchema
  .omit({ id_jogo_fk: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie ao menos um campo para atualizar' });

export const avaliacaoQuerySchema = z.object({
  jogo_id: z.string().regex(/^[1-9]\d*$/, 'jogo_id deve ser um número inteiro positivo').optional(),
});
