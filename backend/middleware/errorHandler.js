// ═══════════════════════════════════════════════════════════════
//  errorHandler.js — Tratamento centralizado de erros
//  Traduz erros do PostgreSQL em respostas HTTP claras
// ═══════════════════════════════════════════════════════════════

// Códigos de erro do PostgreSQL
const PG_ERRORS = {
  '23000': { status: 409, mensagem: 'Conflito de integridade nos dados'           },
  '23502': { status: 400, mensagem: 'Campo obrigatório não pode ser vazio'         },
  '23503': { status: 409, mensagem: 'Referência inválida: registro relacionado não existe' },
  '23505': { status: 409, mensagem: 'Registro duplicado: este dado já existe'      },
  '23514': { status: 400, mensagem: 'Valor fora do permitido pela regra do sistema' },
  '22001': { status: 400, mensagem: 'Valor excede o tamanho máximo permitido'       },
  '22P02': { status: 400, mensagem: 'Formato de dado inválido'                      },
  '42P01': { status: 500, mensagem: 'Tabela não encontrada no banco de dados'       },
  '08006': { status: 503, mensagem: 'Falha na conexão com o banco de dados'         },
  '08001': { status: 503, mensagem: 'Não foi possível conectar ao banco de dados'   },
  '57014': { status: 503, mensagem: 'Consulta cancelada por tempo limite'           },
};

// Mensagens específicas por constraint name
const CONSTRAINT_MESSAGES = {
  uq_usuario_email:          'Este e-mail já está cadastrado',
  uq_perfil_nome:            'Este perfil já existe',
  uq_avaliacao_usuario_jogo: 'Você já avaliou este jogo',
  uq_genero_nome:            'Este gênero já está cadastrado',
  uq_plataforma_nome:        'Esta plataforma já está cadastrada',
  uq_jogo_nome_dev:          'Este jogo desta desenvolvedora já está cadastrado',
  ck_seguidor_diferente:     'Você não pode seguir a si mesmo',
};

// Mensagens específicas por campo (not_null_violation)
const FIELD_MESSAGES = {
  nome_usuario:    'O nome de usuário é obrigatório',
  email:           'O e-mail é obrigatório',
  senha:           'A senha é obrigatória',
  id_perfil_fk:    'O perfil é obrigatório',
  nome_jogo:       'O nome do jogo é obrigatório',
  desenvolvedora:  'A desenvolvedora é obrigatória',
  data_lancamento: 'A data de lançamento é obrigatória',
  descricao:       'A descrição é obrigatória',
  nota:            'A nota é obrigatória',
  titulo:          'O título é obrigatório',
  texto:           'O texto é obrigatório',
  mensagem:        'A mensagem é obrigatória',
};

/**
 * Transforma um erro do PostgreSQL em objeto { status, mensagem }
 */
function interpretarErroPG(err) {
  // Violação de UNIQUE
  if (err.code === '23505') {
    const constraint = err.constraint || '';
    const msg = CONSTRAINT_MESSAGES[constraint]
      || 'Este registro já existe no sistema';
    return { status: 409, mensagem: msg };
  }

  // Violação de NOT NULL
  if (err.code === '23502') {
    const campo = err.column || '';
    const msg = FIELD_MESSAGES[campo]
      || `O campo "${campo}" é obrigatório`;
    return { status: 400, mensagem: msg };
  }

  // Violação de CHECK
  if (err.code === '23514') {
    const constraint = err.constraint || '';
    const msg = CONSTRAINT_MESSAGES[constraint]
      || 'Valor não atende às regras do sistema';
    return { status: 400, mensagem: msg };
  }

  // Violação de FOREIGN KEY
  if (err.code === '23503') {
    return {
      status: 409,
      mensagem: 'Operação inválida: registro referenciado não existe ou possui dependências'
    };
  }

  // Outros erros PostgreSQL conhecidos
  if (PG_ERRORS[err.code]) {
    return PG_ERRORS[err.code];
  }

  // Erro genérico
  return { status: 500, mensagem: 'Erro interno do servidor' };
}

/**
 * Middleware de erro global do Express
 * Registra no servidor com detalhes técnicos,
 * mas retorna mensagem amigável ao cliente
 */
function errorMiddleware(err, req, res, next) {
  // Log técnico completo no servidor
  console.error(`[ERRO] ${req.method} ${req.path}`);
  console.error(`  Código PG : ${err.code    || 'N/A'}`);
  console.error(`  Constraint: ${err.constraint || 'N/A'}`);
  console.error(`  Mensagem  : ${err.message}`);
  console.error(`  Detail    : ${err.detail  || 'N/A'}`);

  const { status, mensagem } = interpretarErroPG(err);
  res.status(status).json({ erro: mensagem });
}

module.exports = { errorMiddleware, interpretarErroPG };
