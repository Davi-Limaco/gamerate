import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, describe, it } from 'node:test';

import { AVATAR_DIR, UPLOAD_ROOT } from '@/utils/uploads.ts';
import { criarConta, http, primeiroJogoId } from './helpers.ts';

// PNG 1x1 válido (assinatura + chunks) — passa no filtro de MIME e na checagem de magic bytes.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const arquivosEmDisco = () => fs.readdirSync(AVATAR_DIR).filter((f) => !f.startsWith('.'));

describe('rotas de upload /api/usuarios/imagem', () => {
  after(() => fs.rmSync(UPLOAD_ROOT, { recursive: true, force: true }));

  it('sem token -> 401 em POST, PUT e DELETE, sem gravar nada em disco', async () => {
    const antes = arquivosEmDisco().length;
    assert.equal((await http().post('/api/usuarios/imagem').attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' })).status, 401);
    assert.equal((await http().put('/api/usuarios/imagem').attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' })).status, 401);
    assert.equal((await http().delete('/api/usuarios/imagem')).status, 401);
    assert.equal(arquivosEmDisco().length, antes);
  });

  it('envio válido -> 201 com caminho público; nome gerado pelo servidor; arquivo acessível', async () => {
    const conta = await criarConta();
    const res = await http().post('/api/usuarios/imagem').set(conta.auth)
      .attach('imagem', PNG, { filename: '../../evil.php.png', contentType: 'image/png' });

    assert.equal(res.status, 201);
    assert.match(res.body.caminho, /^\/uploads\/avatars\/[0-9a-f-]{36}\.png$/);
    assert.equal(res.body.imagem.id_usuario_fk, conta.id);
    assert.ok(!res.body.caminho.includes('evil'), 'o nome enviado pelo cliente não pode ser usado');

    const arquivo = await http().get(res.body.caminho);
    assert.equal(arquivo.status, 200);
    assert.equal(arquivo.headers['content-type'], 'image/png');
    assert.equal(arquivo.headers['x-content-type-options'], 'nosniff');
  });

  it('a foto fica associada ao usuário (aparece em /auth/me e nas avaliações dele)', async () => {
    const conta = await criarConta();
    const { body } = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' });
    const me = await http().get('/api/auth/me').set(conta.auth);
    assert.equal(me.body.caminho_imagem, body.caminho);

    const jogo = await primeiroJogoId();
    const aval = await http().post('/api/avaliacoes').set(conta.auth).send({ id_jogo_fk: jogo, nota: 5, titulo: 'Com foto', texto: 'Avaliação de quem tem avatar.' });
    assert.equal(aval.body.caminho_imagem_usuario, body.caminho);
  });

  it('arquivo acima de 2 MB -> 400 e nada fica gravado', async () => {
    const conta = await criarConta();
    const antes = arquivosEmDisco().length;
    const grande = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    const res = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', grande, { filename: 'grande.png', contentType: 'image/png' });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'LIMIT_FILE_SIZE');
    assert.equal(arquivosEmDisco().length, antes);
  });

  it('tipo não permitido (PDF) -> 400 e nada fica gravado', async () => {
    const conta = await criarConta();
    const antes = arquivosEmDisco().length;
    const res = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', Buffer.from('%PDF-1.4'), { filename: 'a.pdf', contentType: 'application/pdf' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /não permitido/);
    assert.equal(arquivosEmDisco().length, antes);
  });

  it('MIME forjado (HTML como image/png) -> 400 e o arquivo é apagado', async () => {
    const conta = await criarConta();
    const antes = arquivosEmDisco().length;
    const res = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', Buffer.from('<html></html>'), { filename: 'f.png', contentType: 'image/png' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /não é uma imagem válida/);
    assert.equal(arquivosEmDisco().length, antes);
  });

  it('campo com nome errado, sem arquivo e corpo JSON -> 400', async () => {
    const conta = await criarConta();
    const campoErrado = await http().post('/api/usuarios/imagem').set(conta.auth).attach('foto', PNG, { filename: 'a.png', contentType: 'image/png' });
    assert.equal(campoErrado.status, 400);
    assert.equal(campoErrado.body.code, 'LIMIT_UNEXPECTED_FILE');
    const json = await http().post('/api/usuarios/imagem').set(conta.auth).send({});
    assert.equal(json.status, 400);
  });

  it('reenvio (PUT) mantém UM registro, troca o caminho e apaga o arquivo antigo', async () => {
    const conta = await criarConta();
    const primeiro = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' });
    const segundo = await http().put('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'b.png', contentType: 'image/png' });

    assert.equal(segundo.status, 200);
    assert.equal(segundo.body.imagem.id_imagem, primeiro.body.imagem.id_imagem, 'mesmo registro atualizado');
    assert.notEqual(segundo.body.caminho, primeiro.body.caminho);
    assert.equal((await http().get(primeiro.body.caminho)).status, 404, 'arquivo antigo removido do disco');
    assert.equal((await http().get(segundo.body.caminho)).status, 200);
    assert.equal((await http().get('/api/auth/me').set(conta.auth)).body.caminho_imagem, segundo.body.caminho);
  });

  it('reenvio também via POST continua com um único registro (201)', async () => {
    const conta = await criarConta();
    const a = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' });
    const b = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'b.png', contentType: 'image/png' });
    assert.equal(b.status, 201);
    assert.equal(b.body.imagem.id_imagem, a.body.imagem.id_imagem);
  });

  it('DELETE remove a foto (204, arquivo some) e repetir dá 404', async () => {
    const conta = await criarConta();
    const { body } = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' });
    assert.equal((await http().delete('/api/usuarios/imagem').set(conta.auth)).status, 204);
    assert.equal((await http().get(body.caminho)).status, 404);
    assert.equal((await http().get('/api/auth/me').set(conta.auth)).body.caminho_imagem, null);
    assert.equal((await http().delete('/api/usuarios/imagem').set(conta.auth)).status, 404);
  });

  it('remover o usuário apaga também o arquivo da foto', async () => {
    const conta = await criarConta();
    const { body } = await http().post('/api/usuarios/imagem').set(conta.auth).attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' });
    assert.equal((await http().delete(`/api/usuarios/${conta.id}`).set(conta.auth)).status, 204);
    assert.equal((await http().get(body.caminho)).status, 404);
  });

  it('o diretório de uploads não é listado nem serve dotfiles', async () => {
    assert.equal((await http().get('/uploads/avatars/')).status, 404);
    assert.equal((await http().get('/uploads/avatars/.gitignore')).status, 404);
  });
});
