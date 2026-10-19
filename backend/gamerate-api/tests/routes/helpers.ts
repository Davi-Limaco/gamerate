import { randomUUID } from 'node:crypto';
import request from 'supertest';

import app from '@/app.ts';

// Os testes de rotas usam o `app` exportado por src/app.ts diretamente com o
// supertest: nenhuma porta é aberta (não há `listen`), e o banco é o SQLite
// descartável de tests/env/test.env.

export const http = () => request(app);

export const SENHA_PADRAO = 'senha-de-teste-123';

/** E-mail único por chamada: a suíte pode rodar várias vezes sem colisões. */
export function emailUnico(prefixo = 'teste'): string {
  return `${prefixo}.${randomUUID()}@example.test`;
}

/** Sufixo curto e único para nomes (gêneros, plataformas, jogos...). */
export const sufixo = () => randomUUID().slice(0, 8);

export interface ContaDeTeste {
  id: number;
  email: string;
  senha: string;
  token: string;
  auth: { Authorization: string };
}

/** Cria um usuário comum pelo fluxo público de cadastro e devolve token e id. */
export async function criarConta(nome = 'Usuário de Teste'): Promise<ContaDeTeste> {
  const email = emailUnico();
  const res = await http().post('/api/auth/cadastro').send({ nome_usuario: nome, email, senha: SENHA_PADRAO });
  if (res.status !== 201) throw new Error(`cadastro falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    id: res.body.usuario.id_usuario,
    email,
    senha: SENHA_PADRAO,
    token: res.body.token,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}

/** Login do administrador criado pelo seed. */
export async function loginAdmin(): Promise<{ id: number; token: string; auth: { Authorization: string } }> {
  const res = await http().post('/api/auth/login').send({ email: 'admin@gamerate.com', senha: 'admin123' });
  if (res.status !== 200) throw new Error(`login do admin falhou: ${res.status}`);
  return { id: res.body.usuario.id_usuario, token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` } };
}

/** Id do primeiro jogo do catálogo (criado pelo seed). */
export async function primeiroJogoId(): Promise<number> {
  const res = await http().get('/api/jogos');
  return res.body.jogos[0].id_jogo;
}

/** Id de um perfil de acesso pelo nome (os ids dependem do seed). */
export async function idDoPerfil(nome: string): Promise<number> {
  const res = await http().get('/api/perfis');
  return res.body.find((p: { nome_perfil: string }) => p.nome_perfil === nome).id_perfil;
}
