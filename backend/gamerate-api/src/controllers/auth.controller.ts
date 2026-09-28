import type { Request, Response } from 'express';

import Usuario from '@/models/usuario.model.ts';
import HttpError from '@/errors/HttpError.ts';
import SendMail from '@/services/SendMail.ts';
import { verifyPassword } from '@/utils/password.ts';
import { signToken } from '@/utils/jwt.ts';
import type { LoginInput, Usuario as UsuarioType, UsuarioInput } from '@/types/Usuario.d.ts';

/**
 * Remove o hash de senha antes de qualquer resposta ao cliente. Usada em
 * todo lugar deste controller que devolve um usuário na resposta HTTP —
 * garante que o Argon2 hash de `senha` nunca vaza pela API, nem em /me,
 * /login ou /cadastro.
 */
function toPublicUsuario(usuario: UsuarioType): Omit<UsuarioType, 'senha'> {
  const { senha: _senha, ...publico } = usuario;
  return publico;
}

/**
 * POST /auth/cadastro — cria um novo usuário (perfil "Jogador" por padrão) e
 * já devolve um token de sessão, autenticando o usuário imediatamente após o
 * cadastro (evita uma segunda requisição de login logo em seguida).
 */
async function cadastro(req: Request<Record<string, string>, unknown, UsuarioInput>, res: Response<unknown>) {
  let created;

  try {
    created = await Usuario.create(req.body);
  } catch (error) {
    // Cadastro recusado (validação já rodou no middleware `validate`; aqui
    // sobra o 409 de e-mail já cadastrado, lançado pelo Model a partir do
    // erro P2002 do Prisma, ou um erro inesperado do banco) -> nenhum e-mail
    // é disparado e nenhum token é emitido.
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao cadastrar usuário', 500);
  }

  // O cadastro já foi persistido com sucesso: a resposta 201 é garantida a
  // partir daqui. Uma falha no envio do e-mail de boas-vindas (SMTP fora do
  // ar, credenciais erradas etc.) é apenas registrada em log e não deve
  // derrubar a requisição nem mudar o status de resposta.
  SendMail.enviarEmailBoasVindas(created.email, created.nome_usuario).catch((error: unknown) => {
    console.error('Falha ao enviar e-mail de boas-vindas:', error);
  });

  const token = signToken({ sub: created.id_usuario, perfil: created.nome_perfil! });
  res.status(201).json({ token, usuario: toPublicUsuario(created) });
}

/**
 * POST /auth/login — verifica e-mail + senha e devolve um JWT de sessão.
 *
 * Por segurança, a mensagem de erro é sempre "Credenciais inválidas" tanto
 * para e-mail inexistente quanto para senha incorreta: distinguir os dois
 * casos permitiria a um atacante enumerar quais e-mails têm conta cadastrada
 * (user enumeration).
 */
async function login(req: Request<Record<string, string>, unknown, LoginInput>, res: Response<unknown>) {
  const { email, senha } = req.body;

  const usuario = await Usuario.readByEmail(email);
  if (!usuario || !usuario.senha) {
    throw new HttpError('Credenciais inválidas', 401);
  }

  // usuario.senha aqui é o HASH Argon2id armazenado — nunca a senha em texto
  // puro. verifyPassword faz a comparação de forma seguro (tempo constante,
  // interno ao argon2) sem nunca decodificar a senha original a partir do hash.
  const senhaValida = await verifyPassword(usuario.senha, senha);
  if (!senhaValida) {
    throw new HttpError('Credenciais inválidas', 401);
  }

  const token = signToken({ sub: usuario.id_usuario, perfil: usuario.nome_perfil! });
  res.json({ token, usuario: toPublicUsuario(usuario) });
}

/**
 * GET /auth/me — rota protegida de exemplo: só responde para quem apresenta
 * um JWT válido (middleware `authenticate` já populou `req.usuario`).
 * Usada pelo front-end para restaurar a sessão e confirmar que o token salvo
 * localmente ainda é válido.
 */
async function me(req: Request, res: Response<unknown>) {
  // req.usuario é garantido pelo middleware `authenticate` (rota protegida).
  const usuario = await Usuario.readById(req.usuario!.id);
  res.json(toPublicUsuario(usuario));
}

export default { cadastro, login, me };
