import { z } from 'zod';

const dataLancamentoSchema = z
  .string({ required_error: 'data_lancamento é obrigatória' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data_lancamento deve estar no formato YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'data_lancamento deve ser uma data válida');

export const jogoBodySchema = z.object({
  nome_jogo: z.string({ required_error: 'nome_jogo é obrigatório' })
    .min(1, 'nome_jogo é obrigatório')
    .max(200, 'nome_jogo deve ter no máximo 200 caracteres'),
  desenvolvedora: z.string({ required_error: 'desenvolvedora é obrigatória' })
    .min(1, 'desenvolvedora é obrigatória'),
  data_lancamento: dataLancamentoSchema,
  descricao: z.string({ required_error: 'descricao é obrigatória' })
    .min(1, 'descricao é obrigatória'),
  // Aceita tanto caminhos locais (/assets/jogo.jpg) quanto URLs completas.
  capa: z.string().min(1, 'capa não pode ser vazia').nullable().optional(),
  generos: z.array(z.coerce.number().int().positive()).optional(),
  plataformas: z.array(z.coerce.number().int().positive()).optional(),
});

export const jogoUpdateBodySchema = jogoBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie ao menos um campo para atualizar' });

export const jogoQuerySchema = z.object({
  search: z.string().min(1, 'search não pode ser vazio').optional(),
  genero: z.string().min(1, 'genero não pode ser vazio').optional(),
  plataforma: z.string().min(1, 'plataforma não pode ser vazio').optional(),
});
