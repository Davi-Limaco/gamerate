import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SENHA_PADRAO, criarConta, emailUnico, http, idDoPerfil, loginAdmin, primeiroJogoId } from './helpers.ts';

describe('rotas /api/usuarios', () => {
  describe('GET /usuarios (listagem, só administrador)', () => {
    it('sem token -> 401', async () => {
      assert.equal((await http().get('/api/usuarios')).status, 401);
    });

    it('jogador comum -> 403', async () => {
      const conta = await criarConta();
      assert.equal((await http().get('/api/usuarios').set(conta.auth)).status, 403);
    });

    it('administrador -> 200 com a lista, sem senhas', async () => {
      const admin = await loginAdmin();
      const res = await http().get('/api/usuarios').set(admin.auth);
      assert.equal(res.status, 200);
      assert.ok(res.body.length >= 1);
      assert.ok(res.body.every((u: Record<string, unknown>) => !('senha' in u)));
    });
  });

  describe('autorização por dono do recurso (regra crítica)', () => {
    it('um usuário NÃO acessa os dados de outro: 403', async () => {
      const alice = await criarConta('Alice');
      const bruno = await criarConta('Bruno');
      const res = await http().get(`/api/usuarios/${bruno.id}`).set(alice.auth);
      assert.equal(res.status, 403);
    });

    it('um usuário NÃO lê as avaliações de outro: 403', async () => {
      const alice = await criarConta();
      const bruno = await criarConta();
      assert.equal((await http().get(`/api/usuarios/${bruno.id}/avaliacoes`).set(alice.auth)).status, 403);
    });

    it('um usuário NÃO altera nem remove outro: 403 e os dados ficam intactos', async () => {
      const alice = await criarConta('Alice Original');
      const bruno = await criarConta();
      const put = await http().put(`/api/usuarios/${alice.id}`).set(bruno.auth).send({ nome_usuario: 'Hackeada' });
      const del = await http().delete(`/api/usuarios/${alice.id}`).set(bruno.auth);
      assert.equal(put.status, 403);
      assert.equal(del.status, 403);
      const depois = await http().get(`/api/usuarios/${alice.id}`).set(alice.auth);
      assert.equal(depois.body.nome_usuario, 'Alice Original');
    });

    it('o próprio usuário acessa seus dados: 200 e total_avaliacoes zerado', async () => {
      const conta = await criarConta('Dono');
      const res = await http().get(`/api/usuarios/${conta.id}`).set(conta.auth);
      assert.equal(res.status, 200);
      assert.equal(res.body.nome_usuario, 'Dono');
      assert.equal(res.body.total_avaliacoes, 0);
      assert.equal('senha' in res.body, false);
    });

    it('o administrador acessa os dados de qualquer usuário: 200', async () => {
      const conta = await criarConta();
      const admin = await loginAdmin();
      assert.equal((await http().get(`/api/usuarios/${conta.id}`).set(admin.auth)).status, 200);
    });

    it('sem token -> 401', async () => {
      assert.equal((await http().get('/api/usuarios/1')).status, 401);
    });
  });

  describe('consulta (GET /usuarios/:id) e erros de parâmetro', () => {
    it('id inexistente (como administrador) -> 404', async () => {
      const admin = await loginAdmin();
      const res = await http().get('/api/usuarios/99999999').set(admin.auth);
      assert.equal(res.status, 404);
    });

    it('id inválido -> 400 com issue em "id"', async () => {
      const conta = await criarConta();
      const res = await http().get('/api/usuarios/abc').set(conta.auth);
      assert.equal(res.status, 400);
      assert.equal(res.body.issues[0].path, 'id');
    });
  });

  describe('atualização (PUT /usuarios/:id)', () => {
    it('altera nome e e-mail do próprio usuário: 200 e persiste', async () => {
      const conta = await criarConta('Antes');
      const novoEmail = emailUnico('novo');
      const res = await http().put(`/api/usuarios/${conta.id}`).set(conta.auth).send({ nome_usuario: 'Depois', email: novoEmail });
      assert.equal(res.status, 200);
      assert.equal(res.body.nome_usuario, 'Depois');
      const lido = await http().get(`/api/usuarios/${conta.id}`).set(conta.auth);
      assert.equal(lido.body.email, novoEmail);
    });

    it('trocar a senha: a nova funciona no login e a antiga deixa de funcionar', async () => {
      const conta = await criarConta();
      assert.equal((await http().put(`/api/usuarios/${conta.id}`).set(conta.auth).send({ senha: 'senha-nova-456' })).status, 200);
      assert.equal((await http().post('/api/auth/login').send({ email: conta.email, senha: 'senha-nova-456' })).status, 200);
      assert.equal((await http().post('/api/auth/login').send({ email: conta.email, senha: SENHA_PADRAO })).status, 401);
    });

    it('e-mail já usado por outra conta -> 409', async () => {
      const a = await criarConta();
      const b = await criarConta();
      const res = await http().put(`/api/usuarios/${b.id}`).set(b.auth).send({ email: a.email });
      assert.equal(res.status, 409);
    });

    it('corpo vazio ou inválido -> 400', async () => {
      const conta = await criarConta();
      assert.equal((await http().put(`/api/usuarios/${conta.id}`).set(conta.auth).send({})).status, 400);
      assert.equal((await http().put(`/api/usuarios/${conta.id}`).set(conta.auth).send({ email: 'ruim' })).status, 400);
    });

    it('não é possível promover a si mesmo enviando id_perfil_fk: o campo é descartado', async () => {
      const conta = await criarConta();
      const res = await http().put(`/api/usuarios/${conta.id}`).set(conta.auth).send({ nome_usuario: 'Mesmo Nome', id_perfil_fk: await idDoPerfil('Administrador') });
      assert.equal(res.status, 200);
      assert.equal(res.body.nome_perfil, 'Jogador');
    });
  });

  describe('troca de perfil e criação direta (só administrador)', () => {
    it('jogador comum não troca perfil (403) nem cria usuário (403)', async () => {
      const conta = await criarConta();
      const troca = await http().put(`/api/usuarios/${conta.id}/perfil`).set(conta.auth).send({ id_perfil_fk: await idDoPerfil('Administrador') });
      const cria = await http().post('/api/usuarios').set(conta.auth).send({ nome_usuario: 'X Y Z', email: emailUnico(), senha: SENHA_PADRAO });
      assert.equal(troca.status, 403);
      assert.equal(cria.status, 403);
    });

    it('administrador cria usuário (201) e troca o perfil (200)', async () => {
      const admin = await loginAdmin();
      const criado = await http().post('/api/usuarios').set(admin.auth).send({ nome_usuario: 'Criado Admin', email: emailUnico('admin-cria'), senha: SENHA_PADRAO });
      assert.equal(criado.status, 201);
      const troca = await http().put(`/api/usuarios/${criado.body.id_usuario}/perfil`).set(admin.auth).send({ id_perfil_fk: await idDoPerfil('Administrador') });
      assert.equal(troca.status, 200);
      assert.equal(troca.body.nome_perfil, 'Administrador');
    });

    it('perfil inexistente na troca -> 400 (referência inválida)', async () => {
      const admin = await loginAdmin();
      const conta = await criarConta();
      const res = await http().put(`/api/usuarios/${conta.id}/perfil`).set(admin.auth).send({ id_perfil_fk: 99999 });
      assert.equal(res.status, 400);
    });
  });

  describe('remoção (DELETE /usuarios/:id)', () => {
    it('o próprio usuário se remove (204) e depois não é mais encontrado (404)', async () => {
      const conta = await criarConta();
      const admin = await loginAdmin();
      assert.equal((await http().delete(`/api/usuarios/${conta.id}`).set(conta.auth)).status, 204);
      assert.equal((await http().get(`/api/usuarios/${conta.id}`).set(admin.auth)).status, 404);
      assert.equal((await http().delete(`/api/usuarios/${conta.id}`).set(admin.auth)).status, 404);
    });

    it('usuário com avaliações não pode ser removido: 409', async () => {
      const conta = await criarConta();
      const jogo = await primeiroJogoId();
      await http().post('/api/avaliacoes').set(conta.auth).send({ id_jogo_fk: jogo, nota: 4, titulo: 'Bom jogo', texto: 'Gostei.' });
      const res = await http().delete(`/api/usuarios/${conta.id}`).set(conta.auth);
      assert.equal(res.status, 409);
    });
  });

  describe('GET /usuarios/:id/avaliacoes', () => {
    it('lista as avaliações do próprio usuário com o jogo', async () => {
      const conta = await criarConta();
      const jogo = await primeiroJogoId();
      await http().post('/api/avaliacoes').set(conta.auth).send({ id_jogo_fk: jogo, nota: 3.5, titulo: 'Razoável', texto: 'Dá para jogar.' });
      const res = await http().get(`/api/usuarios/${conta.id}/avaliacoes`).set(conta.auth);
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].titulo, 'Razoável');
      assert.equal(res.body[0].id_jogo, jogo);
    });
  });
});
