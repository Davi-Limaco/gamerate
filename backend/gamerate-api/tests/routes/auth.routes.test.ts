import assert from 'node:assert/strict';
import { after, before, describe, it, mock } from 'node:test';

import SendMail from '@/services/SendMail.ts';
import { SENHA_PADRAO, criarConta, emailUnico, http, idDoPerfil } from './helpers.ts';

describe('rotas /api/auth', () => {
  // Dublê do serviço de e-mail: garante que nenhum e-mail é disparado de
  // verdade e permite verificar que o cadastro pediu o envio.
  const enviar = mock.method(SendMail, 'enviarEmailBoasVindas', async () => {});
  before(() => enviar.mock.resetCalls());
  after(() => enviar.mock.restore());

  describe('POST /auth/cadastro', () => {
    it('cria o usuário (201), devolve token e não expõe a senha', async () => {
      const email = emailUnico('cadastro');
      const res = await http().post('/api/auth/cadastro').send({ nome_usuario: 'Maria Teste', email, senha: SENHA_PADRAO });

      assert.equal(res.status, 201);
      assert.equal(typeof res.body.token, 'string');
      assert.equal(res.body.usuario.email, email);
      assert.equal(res.body.usuario.nome_perfil, 'Jogador');
      assert.equal('senha' in res.body.usuario, false, 'o hash da senha nunca pode vazar');
      assert.equal(res.body.usuario.caminho_imagem, null);
    });

    it('dispara o e-mail de boas-vindas (dublê) para o endereço cadastrado', async () => {
      const antes = enviar.mock.callCount();
      const email = emailUnico('boasvindas');
      await http().post('/api/auth/cadastro').send({ nome_usuario: 'Com Email', email, senha: SENHA_PADRAO });
      assert.equal(enviar.mock.callCount(), antes + 1);
      assert.deepEqual(enviar.mock.calls.at(-1)!.arguments, [email, 'Com Email']);
    });

    it('ignora id_perfil_fk enviado no corpo: ninguém se cadastra como administrador', async () => {
      const res = await http().post('/api/auth/cadastro').send({
        nome_usuario: 'Espertinho', email: emailUnico('esperto'), senha: SENHA_PADRAO, id_perfil_fk: await idDoPerfil('Administrador'),
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.usuario.nome_perfil, 'Jogador');
    });

    it('corpo inválido -> 400 com issues por campo e sem e-mail enviado', async () => {
      const antes = enviar.mock.callCount();
      const res = await http().post('/api/auth/cadastro').send({ nome_usuario: 'ab', email: 'nao-e-email', senha: '123' });
      assert.equal(res.status, 400);
      assert.deepEqual(res.body.issues.map((i: { path: string }) => i.path).sort(), ['email', 'nome_usuario', 'senha']);
      assert.equal(enviar.mock.callCount(), antes);
    });

    it('sem Content-Type JSON -> 400', async () => {
      const res = await http().post('/api/auth/cadastro').set('Content-Type', 'text/plain').send('x');
      assert.equal(res.status, 400);
    });

    it('e-mail já cadastrado -> 409 e nenhum e-mail enviado', async () => {
      const conta = await criarConta();
      const antes = enviar.mock.callCount();
      const res = await http().post('/api/auth/cadastro').send({ nome_usuario: 'Duplicado', email: conta.email, senha: SENHA_PADRAO });
      assert.equal(res.status, 409);
      assert.equal(enviar.mock.callCount(), antes);
    });

    it('a resposta 201 não depende do envio de e-mail (falha do SMTP é só registrada)', async () => {
      enviar.mock.mockImplementationOnce(async () => { throw new Error('SMTP fora do ar'); });
      const log = mock.method(console, 'error', () => {});
      const res = await http().post('/api/auth/cadastro').send({ nome_usuario: 'Sem Smtp', email: emailUnico(), senha: SENHA_PADRAO });
      assert.equal(res.status, 201);
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(log.mock.callCount(), 1);
      log.mock.restore();
    });
  });

  describe('POST /auth/login', () => {
    it('credenciais corretas -> 200 com token e usuário sem senha', async () => {
      const conta = await criarConta('Login Ok');
      const res = await http().post('/api/auth/login').send({ email: conta.email, senha: conta.senha });
      assert.equal(res.status, 200);
      assert.equal(typeof res.body.token, 'string');
      assert.equal(res.body.usuario.id_usuario, conta.id);
      assert.equal('senha' in res.body.usuario, false);
    });

    it('senha errada e e-mail inexistente dão 401 com a MESMA mensagem (sem enumerar contas)', async () => {
      const conta = await criarConta();
      const senhaErrada = await http().post('/api/auth/login').send({ email: conta.email, senha: 'outra-senha' });
      const inexistente = await http().post('/api/auth/login').send({ email: emailUnico('fantasma'), senha: 'x' });
      assert.equal(senhaErrada.status, 401);
      assert.equal(inexistente.status, 401);
      assert.equal(senhaErrada.body.error, inexistente.body.error);
      assert.equal(senhaErrada.body.error, 'Credenciais inválidas');
    });

    it('corpo inválido -> 400', async () => {
      const res = await http().post('/api/auth/login').send({ email: 'ruim', senha: '' });
      assert.equal(res.status, 400);
      assert.ok(res.body.issues.length >= 2);
    });
  });

  describe('GET /auth/me', () => {
    it('sem token -> 401', async () => {
      const res = await http().get('/api/auth/me');
      assert.equal(res.status, 401);
    });

    it('token adulterado -> 401', async () => {
      const conta = await criarConta();
      const res = await http().get('/api/auth/me').set('Authorization', `Bearer ${conta.token.slice(0, -3)}abc`);
      assert.equal(res.status, 401);
    });

    it('token válido -> 200 com os dados do próprio usuário', async () => {
      const conta = await criarConta('Quem Sou Eu');
      const res = await http().get('/api/auth/me').set(conta.auth);
      assert.equal(res.status, 200);
      assert.equal(res.body.id_usuario, conta.id);
      assert.equal(res.body.nome_usuario, 'Quem Sou Eu');
      assert.equal('senha' in res.body, false);
    });

    it('token de usuário que foi removido -> 404', async () => {
      const conta = await criarConta();
      assert.equal((await http().delete(`/api/usuarios/${conta.id}`).set(conta.auth)).status, 204);
      const res = await http().get('/api/auth/me').set(conta.auth);
      assert.equal(res.status, 404);
    });
  });
});

describe('rotas inexistentes e arquivos estáticos', () => {
  it('rota de API desconhecida -> 404 em JSON', async () => {
    const res = await http().get('/api/nao-existe');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'Content Not Found' });
  });

  it('o Express serve o front-end estático (login.html)', async () => {
    const res = await http().get('/pages/login.html');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
  });
});
