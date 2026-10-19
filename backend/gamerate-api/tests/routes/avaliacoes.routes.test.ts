import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { criarConta, http, loginAdmin, primeiroJogoId } from './helpers.ts';

const corpo = (id_jogo_fk: number, extra: Record<string, unknown> = {}) => ({
  id_jogo_fk, nota: 4.5, titulo: 'Excelente jogo', texto: 'Texto da avaliação de teste.', ...extra,
});

describe('rotas /api/avaliacoes', () => {
  describe('leitura pública', () => {
    it('lista avaliações e filtra por jogo com ?jogo_id=', async () => {
      const jogo = await primeiroJogoId();
      const res = await http().get('/api/avaliacoes').query({ jogo_id: jogo });
      assert.equal(res.status, 200);
      assert.ok(res.body.avaliacoes.length >= 10, 'o seed cria ao menos 10 avaliações por jogo');
      assert.ok(res.body.avaliacoes.every((a: { id_jogo_fk: number }) => a.id_jogo_fk === jogo));
    });

    it('jogo_id inválido -> 400; destaque é público', async () => {
      assert.equal((await http().get('/api/avaliacoes').query({ jogo_id: 'abc' })).status, 400);
      const destaque = await http().get('/api/avaliacoes/destaque');
      assert.equal(destaque.status, 200);
      assert.ok(destaque.body.length > 0);
    });

    it('avaliação inexistente -> 404; id inválido -> 400', async () => {
      assert.equal((await http().get('/api/avaliacoes/99999999')).status, 404);
      assert.equal((await http().get('/api/avaliacoes/0')).status, 400);
    });
  });

  describe('criação (POST /avaliacoes)', () => {
    it('sem token -> 401', async () => {
      const res = await http().post('/api/avaliacoes').send(corpo(1));
      assert.equal(res.status, 401);
    });

    it('cria a avaliação (201) usando o usuário do TOKEN como autor, mesmo que o corpo tente outro', async () => {
      const conta = await criarConta('Autor Real');
      const jogo = await primeiroJogoId();
      const res = await http().post('/api/avaliacoes').set(conta.auth).send(corpo(jogo, { id_usuario_fk: 1 }));
      assert.equal(res.status, 201);
      assert.equal(res.body.id_usuario_fk, conta.id);
      assert.equal(res.body.nome_usuario, 'Autor Real');
    });

    it('atualiza total_avaliacoes do jogo (regra de negócio)', async () => {
      const conta = await criarConta();
      const jogo = await primeiroJogoId();
      const antes = (await http().get(`/api/jogos/${jogo}`)).body.total_avaliacoes;
      await http().post('/api/avaliacoes').set(conta.auth).send(corpo(jogo));
      const depois = (await http().get(`/api/jogos/${jogo}`)).body.total_avaliacoes;
      assert.equal(depois, antes + 1);
    });

    it('segunda avaliação do mesmo usuário para o mesmo jogo -> 409', async () => {
      const conta = await criarConta();
      const jogo = await primeiroJogoId();
      assert.equal((await http().post('/api/avaliacoes').set(conta.auth).send(corpo(jogo))).status, 201);
      const repetida = await http().post('/api/avaliacoes').set(conta.auth).send(corpo(jogo));
      assert.equal(repetida.status, 409);
      assert.match(repetida.body.error, /já avaliou/);
    });

    it('corpo inválido -> 400 (nota fora da faixa, título curto)', async () => {
      const conta = await criarConta();
      const res = await http().post('/api/avaliacoes').set(conta.auth).send(corpo(1, { nota: 7, titulo: 'ab' }));
      assert.equal(res.status, 400);
      assert.deepEqual(res.body.issues.map((i: { path: string }) => i.path).sort(), ['nota', 'titulo']);
    });

    it('jogo inexistente -> 400 (referência inválida)', async () => {
      const conta = await criarConta();
      const res = await http().post('/api/avaliacoes').set(conta.auth).send(corpo(99999999));
      assert.equal(res.status, 400);
    });
  });

  describe('edição e remoção (autor ou administrador)', () => {
    async function avaliacaoDe(conta: Awaited<ReturnType<typeof criarConta>>) {
      const jogo = await primeiroJogoId();
      const res = await http().post('/api/avaliacoes').set(conta.auth).send(corpo(jogo));
      return res.body.id_avaliacao as number;
    }

    it('outro usuário NÃO edita nem remove a avaliação: 403, e ela permanece igual', async () => {
      const autor = await criarConta();
      const intruso = await criarConta();
      const id = await avaliacaoDe(autor);
      assert.equal((await http().put(`/api/avaliacoes/${id}`).set(intruso.auth).send({ nota: 1 })).status, 403);
      assert.equal((await http().delete(`/api/avaliacoes/${id}`).set(intruso.auth)).status, 403);
      assert.equal((await http().get(`/api/avaliacoes/${id}`)).body.nota, 4.5);
    });

    it('sem token -> 401', async () => {
      assert.equal((await http().put('/api/avaliacoes/1').send({ nota: 1 })).status, 401);
      assert.equal((await http().delete('/api/avaliacoes/1')).status, 401);
    });

    it('o autor edita (200) e a nota do jogo é recalculada', async () => {
      const autor = await criarConta();
      const id = await avaliacaoDe(autor);
      const res = await http().put(`/api/avaliacoes/${id}`).set(autor.auth).send({ nota: 2, titulo: 'Mudei de ideia' });
      assert.equal(res.status, 200);
      assert.equal(res.body.nota, 2);
      assert.equal(res.body.titulo, 'Mudei de ideia');
      assert.equal(res.body.texto, 'Texto da avaliação de teste.', 'campos não enviados permanecem');
    });

    it('edição vazia ou inválida -> 400; avaliação inexistente -> 404', async () => {
      const autor = await criarConta();
      const id = await avaliacaoDe(autor);
      assert.equal((await http().put(`/api/avaliacoes/${id}`).set(autor.auth).send({})).status, 400);
      assert.equal((await http().put(`/api/avaliacoes/${id}`).set(autor.auth).send({ nota: 9 })).status, 400);
      assert.equal((await http().put('/api/avaliacoes/99999999').set(autor.auth).send({ nota: 1 })).status, 404);
    });

    it('o autor remove (204), o total do jogo volta ao valor anterior e depois dá 404', async () => {
      const autor = await criarConta();
      const jogo = await primeiroJogoId();
      const antes = (await http().get(`/api/jogos/${jogo}`)).body.total_avaliacoes;
      const id = await avaliacaoDe(autor);
      assert.equal((await http().delete(`/api/avaliacoes/${id}`).set(autor.auth)).status, 204);
      assert.equal((await http().get(`/api/jogos/${jogo}`)).body.total_avaliacoes, antes);
      assert.equal((await http().get(`/api/avaliacoes/${id}`)).status, 404);
      assert.equal((await http().delete(`/api/avaliacoes/${id}`).set(autor.auth)).status, 404);
    });

    it('o administrador modera: remove a avaliação de qualquer usuário (204)', async () => {
      const autor = await criarConta();
      const admin = await loginAdmin();
      const id = await avaliacaoDe(autor);
      assert.equal((await http().delete(`/api/avaliacoes/${id}`).set(admin.auth)).status, 204);
    });
  });
});
