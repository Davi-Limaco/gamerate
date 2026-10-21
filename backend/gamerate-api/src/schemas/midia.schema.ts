import { z } from 'zod';

/**
 * Campos de texto opcionais chegam de um formulário multipart, onde um campo
 * em branco vem como string vazia. Aqui "" vira `undefined` (campo ausente).
 */
const vazioComoAusente = (valor: unknown) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor);

const titulo = z.string({ required_error: 'titulo é obrigatório' })
  .trim()
  .min(3, 'titulo deve ter no mínimo 3 caracteres')
  .max(100, 'titulo deve ter no máximo 100 caracteres');

const descricao = z.preprocess(
  vazioComoAusente,
  z.string().trim().max(500, 'descricao deve ter no máximo 500 caracteres').optional(),
);

const idJogo = z.preprocess(
  vazioComoAusente,
  z.coerce
    .number({ invalid_type_error: 'id_jogo_fk deve ser um número' })
    .int('id_jogo_fk deve ser um número inteiro')
    .positive('id_jogo_fk deve ser um número positivo')
    .optional(),
);

// POST /midias (multipart): o arquivo é validado pelo Multer; aqui só os campos
// de texto. `tipo`, `caminho` e o autor NUNCA vêm do cliente.
export const midiaBodySchema = z.object({ titulo, descricao, id_jogo_fk: idJogo });

// PUT /midias/:id (JSON): só texto — para trocar o arquivo, poste outro.
export const midiaUpdateBodySchema = z.object({ titulo: titulo.optional(), descricao })
  .refine((dados) => Object.keys(dados).length > 0, { message: 'Envie ao menos um campo para atualizar' });

const idEmTexto = (campo: string) => z.string()
  .regex(/^[1-9]\d*$/, `${campo} deve ser um número inteiro positivo`)
  .refine((valor) => Number.isSafeInteger(Number(valor)), `${campo} está fora do intervalo permitido`);

// GET /midias?tipo=&usuario_id=&jogo_id=&limit=
export const midiaQuerySchema = z.object({
  tipo: z.enum(['imagem', 'video'], { errorMap: () => ({ message: 'tipo deve ser "imagem" ou "video"' }) }).optional(),
  usuario_id: idEmTexto('usuario_id').optional(),
  jogo_id: idEmTexto('jogo_id').optional(),
  limit: z.coerce.number({ invalid_type_error: 'limit deve ser um número' })
    .int('limit deve ser um número inteiro')
    .min(1, 'limit deve ser no mínimo 1')
    .max(100, 'limit deve ser no máximo 100')
    .optional(),
});
