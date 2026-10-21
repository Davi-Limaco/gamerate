import { z } from 'zod';

// POST /favoritos — o usuário vem do token; do corpo só entra o jogo.
export const favoritoBodySchema = z.object({
  id_jogo_fk: z.coerce
    .number({ required_error: 'id_jogo_fk é obrigatório', invalid_type_error: 'id_jogo_fk deve ser um número' })
    .int('id_jogo_fk deve ser um número inteiro')
    .positive('id_jogo_fk deve ser um número positivo'),
});

// DELETE /favoritos/:id_jogo — mesmo formato de id dos demais params do projeto.
export const favoritoParamSchema = z.object({
  id_jogo: z.string()
    .regex(/^[1-9]\d*$/, 'id_jogo deve ser um número inteiro positivo')
    .refine((value) => Number.isSafeInteger(Number(value)), 'id_jogo está fora do intervalo permitido'),
});
