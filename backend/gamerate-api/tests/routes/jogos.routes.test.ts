import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { criarConta, http, loginAdmin, sufixo } from './helpers.ts';

const novoJogo = () => ({
  nome_jogo: `Jogo de Teste ${sufixo()}`,
  desenvolvedora: 'Estúdio Teste',
  data_lancamento: '2024-02-29',
  descricao: 'Jogo criado por um teste automatizado.',
});

describe('rotas /api/jogos', () => {
  describe('leitura pública', () => {
    it('lista os jogos do seed sem exigir login', async () => {
      const res = await http().get('/api/jogos');
      assert.equal(res.status, 200);
      assert.ok(res.body.total >= 8);
      assert.equal(res.body.jogos.length, res.body.total);
      assert.ok('nome_jogo' in res.body.jogos[0]);
    });

    it('filtra por nome com ?search=', async () => {
      const res = await http().get('/api/jogos').query({ search: 'Elden' });
      assert.equal(res.status, 200);
      assert.ok(res.body.jogos.length >= 1);
      assert.ok(res.body.jogos.every((j: { nome_jogo: string }) => /elden/i.test(j.nome_jogo)));
    });

    it('busca sem resultado devolve lista vazia (200)', async () => {
      const res = await http().get('/api/jogos').query({ search: `inexistente-${sufixo()}` });
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 0);
      assert.deepEqual(res.body.jogos, []);
    });

    it('?search= vazio -> 400', async () => {
      assert.equal((await http().get('/api/jogos').query({ search: '' })).status, 400);
    });

    it('busca por id devolve o jogo; id inexistente -> 404; id inválido -> 400', async () => {
      const lista = await http().get('/api/jogos');
      const id = lista.body.jogos[0].id_jogo;
      const ok = await http().get(`/api/jogos/${id}`);
      assert.equal(ok.status, 200);
      assert.equal(ok.body.id_jogo, id);
      assert.equal((await http().get('/api/jogos/99999999')).status, 404);
      assert.equal((await http().get('/api/jogos/abc')).status, 400);
    });

    it('stats e destaques são públicos', async () => {
      const stats = await http().get('/api/jogos/stats');
      assert.equal(stats.status, 200);
      assert.ok(stats.body.total_jogos >= 8);
      assert.equal((await http().get('/api/jogos/destaques')).status, 200);
    });
  });

  describe('escrita restrita a administrador', () => {
    it('sem token -> 401; jogador comum -> 403', async () => {
      const conta = await criarConta();
      assert.equal((await http().post('/api/jogos').send(novoJogo())).status, 401);
      assert.equal((await http().post('/api/jogos').set(conta.auth).send(novoJogo())).status, 403);
      assert.equal((await http().put('/api/jogos/1').set(conta.auth).send({ descricao: 'x' })).status, 403);
      assert.equal((await http().delete('/api/jogos/1').set(conta.auth)).status, 403);
    });

    it('ciclo completo como administrador: criar (201), consultar, atualizar (200), remover (204), 404 depois', async () => {
      const admin = await loginAdmin();
      const dados = novoJogo();

      const criado = await http().post('/api/jogos').set(admin.auth).send(dados);
      assert.equal(criado.status, 201);
      const id = criado.body.id_jogo;
      assert.equal(criado.body.nome_jogo, dados.nome_jogo);

      const lido = await http().get(`/api/jogos/${id}`);
      assert.equal(lido.status, 200);
      assert.equal(lido.body.data_lancamento.slice(0, 10), '2024-02-29');

      const atualizado = await http().put(`/api/jogos/${id}`).set(admin.auth).send({ descricao: 'Descrição atualizada' });
      assert.equal(atualizado.status, 200);
      assert.equal(atualizado.body.descricao, 'Descrição atualizada');
      assert.equal(atualizado.body.nome_jogo, dados.nome_jogo, 'campos não enviados permanecem');

      assert.equal((await http().delete(`/api/jogos/${id}`).set(admin.auth)).status, 204);
      assert.equal((await http().get(`/api/jogos/${id}`)).status, 404);
      assert.equal((await http().delete(`/api/jogos/${id}`).set(admin.auth)).status, 404);
    });

    it('dados inválidos -> 400 com issues (data impossível, campo vazio)', async () => {
      const admin = await loginAdmin();
      const res = await http().post('/api/jogos').set(admin.auth).send({ ...novoJogo(), data_lancamento: '2021-02-30', nome_jogo: '' });
      assert.equal(res.status, 400);
      assert.deepEqual(res.body.issues.map((i: { path: string }) => i.path).sort(), ['data_lancamento', 'nome_jogo']);
    });

    it('atualizar jogo inexistente -> 404 e corpo vazio -> 400', async () => {
      const admin = await loginAdmin();
      assert.equal((await http().put('/api/jogos/99999999').set(admin.auth).send({ descricao: 'x' })).status, 404);
      assert.equal((await http().put('/api/jogos/1').set(admin.auth).send({})).status, 400);
    });

    it('referência a gênero inexistente na criação é recusada (4xx) e o jogo não é criado', async () => {
      const admin = await loginAdmin();
      const dados = { ...novoJogo(), generos: [99999] };
      const res = await http().post('/api/jogos').set(admin.auth).send(dados);
      assert.ok(res.status >= 400 && res.status < 500, `status ${res.status}`);
      const busca = await http().get('/api/jogos').query({ search: dados.nome_jogo });
      assert.equal(busca.body.total, 0, 'a criação deve ser desfeita por inteiro');
    });
  });
});
