import { z } from 'zod';

const positiveId = z.coerce.number().int().positive('ID deve ser um número inteiro positivo');
const stringOptional = z.string().trim().min(1, 'Campo obrigatório');

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('E-mail inválido'),
    senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  }),
});

export const createUsuarioSchema = z.object({
  body: z.object({
    nome_usuario: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().trim().email('E-mail inválido'),
    senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  }),
});

export const updateUsuarioSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
  body: z.object({
    nome_usuario: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    email: z.string().trim().email('E-mail inválido').optional(),
    senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  }),
});

export const updatePerfilSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
  body: z.object({
    id_perfil_fk: positiveId,
  }),
});

export const createJogoSchema = z.object({
  body: z.object({
    nome_jogo: z.string().trim().min(2, 'Nome do jogo obrigatório'),
    desenvolvedora: z.string().trim().min(2, 'Desenvolvedora obrigatória'),
    data_lancamento: z.string().trim().min(1, 'Data de lançamento obrigatória'),
    descricao: z.string().trim().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    capa: z.string().url('URL da capa inválida').nullable().optional(),
    generos: z.array(z.number().int().positive()).optional(),
    plataformas: z.array(z.number().int().positive()).optional(),
  }),
});

export const updateJogoSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
  body: z.object({
    nome_jogo: z.string().trim().min(2, 'Nome do jogo obrigatório').optional(),
    desenvolvedora: z.string().trim().min(2, 'Desenvolvedora obrigatória').optional(),
    data_lancamento: z.string().trim().min(1, 'Data de lançamento obrigatória').optional(),
    descricao: z.string().trim().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
    capa: z.string().url('URL da capa inválida').nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  }),
});

export const readJogoSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    genero: z.string().trim().optional(),
    plataforma: z.string().trim().optional(),
  }),
});

export const readJogoByIdSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const createAvaliacaoSchema = z.object({
  body: z.object({
    id_jogo_fk: positiveId,
    nota: z.coerce.number().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
    titulo: z.string().trim().min(2, 'Título deve ter pelo menos 2 caracteres'),
    texto: z.string().trim().min(10, 'Texto deve ter pelo menos 10 caracteres'),
  }),
});

export const updateAvaliacaoSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
  body: z.object({
    nota: z.coerce.number().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5').optional(),
    titulo: z.string().trim().min(2, 'Título deve ter pelo menos 2 caracteres').optional(),
    texto: z.string().trim().min(10, 'Texto deve ter pelo menos 10 caracteres').optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  }),
});

export const readAvaliacaoByIdSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const readAvaliacoesSchema = z.object({
  query: z.object({
    jogo_id: z.coerce.number().int().positive().optional(),
  }),
});

export const createGeneroSchema = z.object({
  body: z.object({
    nome_genero: z.string().trim().min(2, 'Nome do gênero deve ter pelo menos 2 caracteres'),
  }),
});

export const removeGeneroSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const createPlataformaSchema = z.object({
  body: z.object({
    nome_plataforma: z.string().trim().min(2, 'Nome da plataforma deve ter pelo menos 2 caracteres'),
  }),
});

export const removePlataformaSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const createPerfilSchema = z.object({
  body: z.object({
    nome_perfil: z.string().trim().min(2, 'Nome do perfil deve ter pelo menos 2 caracteres'),
  }),
});

export const updatePerfilAdminSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
  body: z.object({
    nome_perfil: z.string().trim().min(2, 'Nome do perfil deve ter pelo menos 2 caracteres').optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  }),
});

export const removePerfilSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const createContatoSchema = z.object({
  body: z.object({
    email_contato: z.string().trim().email('E-mail de contato inválido'),
    tipo: z.string().trim().min(2, 'Tipo obrigatório'),
    mensagem: z.string().trim().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
  }),
});

export const removeContatoSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const readUsuarioByIdSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const readUsuarioAvaliacoesSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const removeUsuarioSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const cadastroSchema = createUsuarioSchema;

export const idSchema = z.object({
  params: z.object({
    id: positiveId,
  }),
});

export const createPerfilRouteSchema = createPerfilSchema;
export const removePerfilRouteSchema = removePerfilSchema;
export const createGeneroRouteSchema = createGeneroSchema;
export const createPlataformaRouteSchema = createPlataformaSchema;
export const createContatoRouteSchema = createContatoSchema;
