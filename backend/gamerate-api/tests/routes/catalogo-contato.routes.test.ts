import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { criarConta, emailUnico, http, loginAdmin, sufixo } from './helpers.ts';

describe('rotas de catálogo (/api/generos, /plataformas, /perfis)', () => {
  it('consulta pública devolve listas com os dados do seed', async () => {
    for (const rota of ['generos', 'plataformas']) {
      const res = await http().get(`/api/${rota}`);
      assert.equal(res.status, 200, rota);
      assert.ok(res.body.length > 0, rota);
    }
    const perfis = await http().get('/api/perfis');
    const nomes = perfis.body.map((p: { nome_perfil: string }) => p.nome_perfil);
    assert.ok(nomes.includes('Jogador') && nomes.includes('Administrador'));
  });

  for (const [rota, campo] of [['generos', 'nome_genero'], ['plataformas', 'nome_plataforma'], ['perfis', 'nome_perfil']] as const) {
    describe(`/api/${rota}`, () => {
      it('sem token -> 401; jogador comum -> 403', async () => {
        const conta = await criarConta();
        assert.equal((await http().post(`/api/${rota}`).send({ [campo]: `X-${sufixo()}` })).status, 401);
        assert.equal((await http().post(`/api/${rota}`).set(conta.auth).send({ [campo]: `X-${sufixo()}` })).status, 403);
      });

      it('administrador cria (201), duplicado dá 409, nome inválido dá 400 e remove (204 / depois 404)', async () => {
        const admin = await loginAdmin();
        const nome = `Teste-${sufixo()}`;
        const criado = await http().post(`/api/${rota}`).set(admin.auth).send({ [campo]: nome });
        assert.equal(criado.status, 201);
        const id = Object.values(criado.body).find((v) => typeof v === 'number') as number;

        assert.equal((await http().post(`/api/${rota}`).set(admin.auth).send({ [campo]: nome })).status, 409);
        assert.equal((await http().post(`/api/${rota}`).set(admin.auth).send({ [campo]: 'a' })).status, 400);

        assert.equal((await http().delete(`/api/${rota}/${id}`).set(admin.auth)).status, 204);
        assert.equal((await http().delete(`/api/${rota}/${id}`).set(admin.auth)).status, 404);
      });
    });
  }

  it('administrador renomeia um perfil (PUT /perfis/:id) e perfil inexistente dá 404', async () => {
    const admin = await loginAdmin();
    const criado = await http().post('/api/perfis').set(admin.auth).send({ nome_perfil: `Temp-${sufixo()}` });
    const novoNome = `Renomeado-${sufixo()}`;
    const res = await http().put(`/api/perfis/${criado.body.id_perfil}`).set(admin.auth).send({ nome_perfil: novoNome });
    assert.equal(res.status, 200);
    assert.equal(res.body.nome_perfil, novoNome);
    assert.equal((await http().put('/api/perfis/99999999').set(admin.auth).send({ nome_perfil: 'Qualquer' })).status, 404);
    await http().delete(`/api/perfis/${criado.body.id_perfil}`).set(admin.auth);
  });

  it('perfil em uso por usuários não pode ser removido (erro 4xx) e continua existindo', async () => {
    const admin = await loginAdmin();
    const perfis = await http().get('/api/perfis');
    const jogador = perfis.body.find((p: { nome_perfil: string }) => p.nome_perfil === 'Jogador');
    await criarConta();
    const res = await http().delete(`/api/perfis/${jogador.id_perfil}`).set(admin.auth);
    assert.ok(res.status >= 400 && res.status < 500, `status ${res.status}`);
    const perfisDepois = await http().get('/api/perfis');
    assert.ok(perfisDepois.body.some((p: { id_perfil: number }) => p.id_perfil === jogador.id_perfil));
  });
});

describe('rotas /api/contato', () => {
  const valido = () => ({ email_contato: emailUnico('contato'), tipo: 'Dúvida', mensagem: 'Gostaria de saber mais sobre o GameRate.' });

  it('qualquer visitante envia mensagem (201)', async () => {
    const res = await http().post('/api/contato').send(valido());
    assert.equal(res.status, 201);
  });

  it('mensagem curta e e-mail inválido -> 400; Content-Type errado -> 400', async () => {
    const res = await http().post('/api/contato').send({ ...valido(), mensagem: 'curta', email_contato: 'x' });
    assert.equal(res.status, 400);
    assert.equal(res.body.issues.length, 2);
    assert.equal((await http().post('/api/contato').set('Content-Type', 'text/plain').send('x')).status, 400);
  });

  it('ler e remover mensagens é só para administrador', async () => {
    const conta = await criarConta();
    const admin = await loginAdmin();
    assert.equal((await http().get('/api/contato')).status, 401);
    assert.equal((await http().get('/api/contato').set(conta.auth)).status, 403);
    assert.equal((await http().delete('/api/contato/1').set(conta.auth)).status, 403);

    const dados = valido();
    const criado = await http().post('/api/contato').send(dados);
    const lista = await http().get('/api/contato').set(admin.auth);
    assert.equal(lista.status, 200);
    assert.ok(lista.body.some((c: { email_contato: string }) => c.email_contato === dados.email_contato));

    const id = criado.body.id_comunicacao;
    assert.equal((await http().delete(`/api/contato/${id}`).set(admin.auth)).status, 204);
    assert.equal((await http().delete(`/api/contato/${id}`).set(admin.auth)).status, 404);
  });
});
