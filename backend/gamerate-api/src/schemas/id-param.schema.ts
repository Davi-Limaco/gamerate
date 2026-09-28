import { z } from 'zod';

/**
 * Params de rota com um :id numérico e autoincrementado (ex.: /usuarios/:id,
 * /jogos/:id). O projeto usa IDs inteiros (INTEGER PRIMARY KEY AUTOINCREMENT),
 * não UUID — por isso o formato validado aqui é "inteiro positivo em string".
 */
export const idParamSchema = z.object({
  id: z.string()
    .regex(/^[1-9]\d*$/, 'id deve ser um número inteiro positivo')
    .refine((value) => Number.isSafeInteger(Number(value)), 'id está fora do intervalo permitido'),
});
