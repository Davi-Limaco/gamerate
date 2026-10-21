import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { criarConta, http, loginAdmin, primeiroJogoId, sufixo } from './helpers.ts';

/** Segundo jogo do catálogo (para testar mais de um favorito). */
async function segundoJogoId(): Promise<number> {
  const res = await http().get('/api/jogos');
  return res.body.jogos[1].id_jogo;
}

describe('rotas /api/favoritos', () => {
  it('sem token -> 401 em GET, POST e DELETE', async () => {
    assert.equal((await http().get('/api/favoritos')).status, 401);
    assert.equal((await http().post('/api/favoritos').send({ id_jogo_fk: 1 })).status, 401);
    assert.equal((await http().delete('/api/favoritos/1')).status, 401);
  });

  it('usuário novo começa sem favoritos (lista vazia)', async () => {
    const conta = await criarConta();
    const res = await http().get('/api/favoritos').set(conta.auth);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  it('favorita um jogo do banco (201) e ele aparece na lista com os dados do jogo', async () => {
    const conta = await criarConta();
    const jogo = await primeiroJogoId();
    const criado = await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: jogo });
    assert.equal(criado.status, 201);
    assert.equal(criado.body.id_jogo, jogo);
    assert.equal(typeof criado.body.nome_jogo, 'string');

    const lista = await http().get('/api/favoritos').set(conta.auth);
    assert.equal(lista.body.length, 1);
    assert.equal(lista.body[0].id_jogo, jogo);
    assert.ok('capa' in lista.body[0] && 'nota_media' in lista.body[0]);
  });

  it('aceita id_jogo_fk numérico enviado como texto (coerção do schema)', async () => {
    const conta = await criarConta();
    const jogo = await primeiroJogoId();
    assert.equal((await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: String(jogo) })).status, 201);
  });

  it('favoritar o mesmo jogo duas vezes -> 409 e continua um só registro', async () => {
    const conta = await criarConta();
    const jogo = await primeiroJogoId();
    await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: jogo });
    const repetido = await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: jogo });
    assert.equal(repetido.status, 409);
    assert.equal((await http().get('/api/favoritos').set(conta.auth)).body.length, 1);
  });

  it('jogo inexistente -> 404; corpo inválido -> 400; Content-Type errado -> 400', async () => {
    const conta = await criarConta();
    assert.equal((await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: 99999999 })).status, 404);
    for (const corpo of [{}, { id_jogo_fk: 0 }, { id_jogo_fk: -3 }, { id_jogo_fk: 'abc' }, { id_jogo_fk: 1.5 }]) {
      const res = await http().post('/api/favoritos').set(conta.auth).send(corpo);
      assert.equal(res.status, 400, JSON.stringify(corpo));
    }
    const texto = await http().post('/api/favoritos').set(conta.auth).set('Content-Type', 'text/plain').send('x');
    assert.equal(texto.status, 400);
  });

  it('cada usuário vê só os próprios favoritos (isolamento)', async () => {
    const alice = await criarConta();
    const bruno = await criarConta();
    await http().post('/api/favoritos').set(alice.auth).send({ id_jogo_fk: await primeiroJogoId() });
    assert.equal((await http().get('/api/favoritos').set(alice.auth)).body.length, 1);
    assert.deepEqual((await http().get('/api/favoritos').set(bruno.auth)).body, []);
    // Bruno não consegue remover o favorito da Alice: para ele, esse favorito não existe (404).
    assert.equal((await http().delete(`/api/favoritos/${await primeiroJogoId()}`).set(bruno.auth)).status, 404);
    assert.equal((await http().get('/api/favoritos').set(alice.auth)).body.length, 1);
  });

  it('remove o favorito (204); remover de novo -> 404; id inválido -> 400', async () => {
    const conta = await criarConta();
    const jogo = await primeiroJogoId();
    await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: jogo });
    assert.equal((await http().delete(`/api/favoritos/${jogo}`).set(conta.auth)).status, 204);
    assert.equal((await http().delete(`/api/favoritos/${jogo}`).set(conta.auth)).status, 404);
    assert.equal((await http().delete('/api/favoritos/abc').set(conta.auth)).status, 400);
    assert.equal((await http().delete('/api/favoritos/0').set(conta.auth)).status, 400);
    assert.deepEqual((await http().get('/api/favoritos').set(conta.auth)).body, []);
  });

  it('vários favoritos: o mais recente aparece primeiro', async () => {
    const conta = await criarConta();
    const a = await primeiroJogoId();
    const b = await segundoJogoId();
    await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: a });
    await new Promise((resolve) => setTimeout(resolve, 1100)); // data_criacao tem resolução de segundos no SQLite
    await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: b });
    const lista = await http().get('/api/favoritos').set(conta.auth);
    assert.deepEqual(lista.body.map((f: { id_jogo: number }) => f.id_jogo), [b, a]);
  });

  it('remover o jogo do catálogo remove os favoritos dele (cascade)', async () => {
    const admin = await loginAdmin();
    const conta = await criarConta();
    const jogo = await http().post('/api/jogos').set(admin.auth).send({
      nome_jogo: `Jogo Favorito ${sufixo()}`, desenvolvedora: 'Teste', data_lancamento: '2024-01-01', descricao: 'Jogo temporário.',
    });
    await http().post('/api/favoritos').set(conta.auth).send({ id_jogo_fk: jogo.body.id_jogo });
    assert.equal((await http().get('/api/favoritos').set(conta.auth)).body.length, 1);
    assert.equal((await http().delete(`/api/jogos/${jogo.body.id_jogo}`).set(admin.auth)).status, 204);
    assert.deepEqual((await http().get('/api/favoritos').set(conta.auth)).body, []);
  });
});
