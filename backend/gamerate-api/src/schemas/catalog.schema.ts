import { z } from 'zod';

export const generoBodySchema = z.object({
  nome_genero: z.string({ required_error: 'nome_genero é obrigatório' })
    .min(2, 'nome_genero deve ter no mínimo 2 caracteres')
    .max(60, 'nome_genero deve ter no máximo 60 caracteres'),
});

export const plataformaBodySchema = z.object({
  nome_plataforma: z.string({ required_error: 'nome_plataforma é obrigatório' })
    .min(2, 'nome_plataforma deve ter no mínimo 2 caracteres')
    .max(60, 'nome_plataforma deve ter no máximo 60 caracteres'),
});

export const perfilBodySchema = z.object({
  nome_perfil: z.string({ required_error: 'nome_perfil é obrigatório' })
    .min(2, 'nome_perfil deve ter no mínimo 2 caracteres')
    .max(60, 'nome_perfil deve ter no máximo 60 caracteres'),
});
