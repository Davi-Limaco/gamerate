import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, describe, it } from 'node:test';

import { MIDIA_DIR, UPLOAD_ROOT } from '@/utils/uploads.ts';
import { criarConta, http, loginAdmin, primeiroJogoId, sufixo } from './helpers.ts';

// Arquivos reais de exemplo (gerados com ffmpeg) em test-files/.
const MP4 = fs.readFileSync(new URL('../../test-files/gameplay.mp4', import.meta.url));
const WEBM = fs.readFileSync(new URL('../../test-files/gameplay.webm', import.meta.url));
const JPG = fs.readFileSync(new URL('../../test-files/print.jpg', import.meta.url));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const arquivosEmDisco = () => fs.readdirSync(MIDIA_DIR).filter((f) => !f.startsWith('.'));

type Conta = Awaited<ReturnType<typeof criarConta>>;

/** Posta uma mídia: campos de texto primeiro, arquivo depois (como o formulário do front-end). */
function postar(conta: Conta, arquivo: Buffer, filename: string, contentType: string, campos: Record<string, string> = { titulo: 'Meu gameplay' }) {
  let req = http().post('/api/midias').set(conta.auth);
  for (const [nome, valor] of Object.entries(campos)) req = req.field(nome, valor);
  return req.attach('arquivo', arquivo, { filename, contentType });
}

describe('rotas /api/midias (prints e vídeos de gameplay)', () => {
  after(() => fs.rmSync(UPLOAD_ROOT, { recursive: true, force: true }));

  describe('POST /midias', () => {
    it('sem token -> 401 e nada é gravado em disco', async () => {
      const antes = arquivosEmDisco().length;
      const res = await http().post('/api/midias').field('titulo', 'Sem login').attach('arquivo', PNG, { filename: 'a.png', contentType: 'image/png' });
      assert.equal(res.status, 401);
      assert.equal(arquivosEmDisco().length, antes);
    });

    it('print (JPEG) -> 201, tipo "imagem", nome gerado pelo servidor e arquivo acessível', async () => {
      const conta = await criarConta('Streamer');
      const res = await postar(conta, JPG, '../../hack.php.jpg', 'image/jpeg', { titulo: 'Print épico', descricao: 'Fase final' });

      assert.equal(res.status, 201);
      assert.equal(res.body.tipo, 'imagem');
      assert.match(res.body.caminho, /^\/uploads\/midias\/[0-9a-f-]{36}\.jpg$/);
      assert.equal(res.body.titulo, 'Print épico');
      assert.equal(res.body.descricao, 'Fase final');
      assert.equal(res.body.id_usuario_fk, conta.id);
      assert.equal(res.body.nome_usuario, 'Streamer');
      assert.equal(res.body.id_jogo_fk, null);

      const arquivo = await http().get(res.body.caminho);
      assert.equal(arquivo.status, 200);
      assert.equal(arquivo.headers['content-type'], 'image/jpeg');
    });

    it('vídeo MP4 e WebM -> 201, tipo "video", servidos com o content-type correto', async () => {
      const conta = await criarConta();
      const mp4 = await postar(conta, MP4, 'run.mp4', 'video/mp4');
      const webm = await postar(conta, WEBM, 'run.webm', 'video/webm');
      assert.equal(mp4.status, 201);
      assert.equal(webm.status, 201);
      assert.equal(mp4.body.tipo, 'video');
      assert.equal(webm.body.tipo, 'video');
      assert.equal((await http().get(mp4.body.caminho)).headers['content-type'], 'video/mp4');
      assert.equal((await http().get(webm.body.caminho)).headers['content-type'], 'video/webm');
    });

    it('o servidor entrega o vídeo em partes (Range) para o player do navegador', async () => {
      const conta = await criarConta();
      const { body } = await postar(conta, MP4, 'run.mp4', 'video/mp4');
      const parcial = await http().get(body.caminho).set('Range', 'bytes=0-99');
      assert.equal(parcial.status, 206);
      assert.match(parcial.headers['content-range'], /^bytes 0-99\//);
    });

    it('associa a mídia a um jogo do banco e devolve o nome do jogo', async () => {
      const conta = await criarConta();
      const jogo = await primeiroJogoId();
      const res = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Com jogo', id_jogo_fk: String(jogo) });
      assert.equal(res.status, 201);
      assert.equal(res.body.id_jogo_fk, jogo);
      assert.equal(typeof res.body.nome_jogo, 'string');
    });

    it('descrição e jogo em branco (formulário vazio) viram ausentes, não erro', async () => {
      const conta = await criarConta();
      const res = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Só o essencial', descricao: '', id_jogo_fk: '' });
      assert.equal(res.status, 201);
      assert.equal(res.body.descricao, null);
      assert.equal(res.body.id_jogo_fk, null);
    });

    it('jogo inexistente -> 404 e o arquivo recém-gravado é apagado', async () => {
      const conta = await criarConta();
      const antes = arquivosEmDisco().length;
      const res = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Jogo fantasma', id_jogo_fk: '99999999' });
      assert.equal(res.status, 404);
      assert.equal(arquivosEmDisco().length, antes);
    });

    it('campos inválidos (título curto, jogo negativo) -> 400 com issues e arquivo apagado', async () => {
      const conta = await criarConta();
      const antes = arquivosEmDisco().length;
      const res = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'ab', id_jogo_fk: '-4' });
      assert.equal(res.status, 400);
      assert.deepEqual(res.body.issues.map((i: { path: string }) => i.path).sort(), ['id_jogo_fk', 'titulo']);
      assert.equal(arquivosEmDisco().length, antes);
    });

    it('sem título -> 400; sem arquivo -> 400', async () => {
      const conta = await criarConta();
      const semTitulo = await http().post('/api/midias').set(conta.auth).attach('arquivo', PNG, { filename: 'a.png', contentType: 'image/png' });
      assert.equal(semTitulo.status, 400);
      const semArquivo = await http().post('/api/midias').set(conta.auth).field('titulo', 'Sem arquivo');
      assert.equal(semArquivo.status, 400);
      assert.match(semArquivo.body.error, /Nenhum arquivo enviado/);
    });

    it('tipo não permitido (PDF) -> 400 e nada gravado', async () => {
      const conta = await criarConta();
      const antes = arquivosEmDisco().length;
      const res = await postar(conta, Buffer.from('%PDF-1.4'), 'a.pdf', 'application/pdf');
      assert.equal(res.status, 400);
      assert.match(res.body.error, /não permitido/);
      assert.equal(arquivosEmDisco().length, antes);
    });

    it('MIME forjado -> 400 e o arquivo é apagado (HTML como vídeo; imagem declarada como vídeo)', async () => {
      const conta = await criarConta();
      const antes = arquivosEmDisco().length;
      const html = await postar(conta, Buffer.from('<html><script>alert(1)</script></html>'), 'x.mp4', 'video/mp4');
      const trocado = await postar(conta, PNG, 'x.mp4', 'video/mp4');
      const videoComoImagem = await postar(conta, MP4, 'x.png', 'image/png');
      for (const res of [html, trocado, videoComoImagem]) {
        assert.equal(res.status, 400);
        assert.match(res.body.error, /não corresponde/);
      }
      assert.equal(arquivosEmDisco().length, antes);
    });

    it('arquivo acima do limite -> 400 com a mensagem do limite das mídias e nada gravado', async () => {
      const conta = await criarConta();
      const antes = arquivosEmDisco().length;
      const grande = Buffer.concat([MP4, Buffer.alloc(1024 * 1024)]); // > 1 MB (limite do ambiente de teste)
      const res = await postar(conta, grande, 'grande.mp4', 'video/mp4');
      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'LIMIT_FILE_SIZE');
      assert.match(res.body.error, /máximo é 1 MB/);
      assert.equal(arquivosEmDisco().length, antes);
    });

    it('excesso de campos de texto -> 400', async () => {
      const conta = await criarConta();
      const res = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Campos demais', descricao: 'x', id_jogo_fk: '1', extra: 'y' });
      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'LIMIT_FIELD_COUNT');
    });

    it('campo de arquivo com nome errado -> 400', async () => {
      const conta = await criarConta();
      const res = await http().post('/api/midias').set(conta.auth).field('titulo', 'Nome errado').attach('imagem', PNG, { filename: 'a.png', contentType: 'image/png' });
      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'LIMIT_UNEXPECTED_FILE');
    });
  });

  describe('GET /midias (galeria pública)', () => {
    it('lista sem exigir login e filtra por usuário, tipo e jogo', async () => {
      const conta = await criarConta();
      const jogo = await primeiroJogoId();
      await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Print um', id_jogo_fk: String(jogo) });
      await postar(conta, MP4, 'a.mp4', 'video/mp4', { titulo: 'Vídeo um' });

      const todas = await http().get('/api/midias').query({ usuario_id: conta.id });
      assert.equal(todas.status, 200);
      assert.equal(todas.body.length, 2);

      const videos = await http().get('/api/midias').query({ usuario_id: conta.id, tipo: 'video' });
      assert.deepEqual(videos.body.map((m: { titulo: string }) => m.titulo), ['Vídeo um']);

      const doJogo = await http().get('/api/midias').query({ usuario_id: conta.id, jogo_id: jogo });
      assert.deepEqual(doJogo.body.map((m: { titulo: string }) => m.titulo), ['Print um']);

      const limitada = await http().get('/api/midias').query({ usuario_id: conta.id, limit: 1 });
      assert.equal(limitada.body.length, 1);
    });

    it('usuário sem mídias recebe lista vazia', async () => {
      const conta = await criarConta();
      const res = await http().get('/api/midias').query({ usuario_id: conta.id });
      assert.deepEqual(res.body, []);
    });

    it('filtros inválidos -> 400', async () => {
      for (const query of [{ tipo: 'audio' }, { usuario_id: 'abc' }, { jogo_id: '0' }, { limit: 0 }, { limit: 101 }]) {
        assert.equal((await http().get('/api/midias').query(query)).status, 400, JSON.stringify(query));
      }
    });

    it('busca por id: 200 com os dados; inexistente -> 404; inválido -> 400', async () => {
      const conta = await criarConta();
      const { body } = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Achar por id' });
      const res = await http().get(`/api/midias/${body.id_midia}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.titulo, 'Achar por id');
      assert.equal((await http().get('/api/midias/99999999')).status, 404);
      assert.equal((await http().get('/api/midias/abc')).status, 400);
    });
  });

  describe('PUT e DELETE /midias/:id (autor ou administrador)', () => {
    it('o autor edita título e descrição (200); campos não enviados permanecem', async () => {
      const conta = await criarConta();
      const { body } = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Original', descricao: 'Texto' });
      const res = await http().put(`/api/midias/${body.id_midia}`).set(conta.auth).send({ titulo: 'Editado' });
      assert.equal(res.status, 200);
      assert.equal(res.body.titulo, 'Editado');
      assert.equal(res.body.descricao, 'Texto');
      assert.equal(res.body.caminho, body.caminho, 'o arquivo não muda na edição');
    });

    it('outro usuário NÃO edita nem exclui a mídia: 403, e ela permanece com o arquivo', async () => {
      const autor = await criarConta();
      const intruso = await criarConta();
      const { body } = await postar(autor, PNG, 'a.png', 'image/png', { titulo: 'Minha mídia' });
      assert.equal((await http().put(`/api/midias/${body.id_midia}`).set(intruso.auth).send({ titulo: 'Roubada' })).status, 403);
      assert.equal((await http().delete(`/api/midias/${body.id_midia}`).set(intruso.auth)).status, 403);
      assert.equal((await http().get(`/api/midias/${body.id_midia}`)).body.titulo, 'Minha mídia');
      assert.equal((await http().get(body.caminho)).status, 200);
    });

    it('sem token -> 401; corpo vazio ou inválido -> 400; mídia inexistente -> 404', async () => {
      const conta = await criarConta();
      const { body } = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Para editar' });
      assert.equal((await http().put(`/api/midias/${body.id_midia}`).send({ titulo: 'x y z' })).status, 401);
      assert.equal((await http().delete(`/api/midias/${body.id_midia}`)).status, 401);
      assert.equal((await http().put(`/api/midias/${body.id_midia}`).set(conta.auth).send({})).status, 400);
      assert.equal((await http().put(`/api/midias/${body.id_midia}`).set(conta.auth).send({ titulo: 'ab' })).status, 400);
      assert.equal((await http().put('/api/midias/99999999').set(conta.auth).send({ titulo: 'Qualquer' })).status, 404);
      assert.equal((await http().delete('/api/midias/99999999').set(conta.auth)).status, 404);
    });

    it('o autor exclui (204): registro e arquivo somem; excluir de novo -> 404', async () => {
      const conta = await criarConta();
      const { body } = await postar(conta, MP4, 'a.mp4', 'video/mp4', { titulo: 'Para apagar' });
      assert.equal((await http().delete(`/api/midias/${body.id_midia}`).set(conta.auth)).status, 204);
      assert.equal((await http().get(body.caminho)).status, 404);
      assert.equal((await http().get(`/api/midias/${body.id_midia}`)).status, 404);
      assert.equal((await http().delete(`/api/midias/${body.id_midia}`).set(conta.auth)).status, 404);
    });

    it('o administrador modera: exclui a mídia de qualquer usuário (204)', async () => {
      const conta = await criarConta();
      const admin = await loginAdmin();
      const { body } = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Moderar' });
      assert.equal((await http().delete(`/api/midias/${body.id_midia}`).set(admin.auth)).status, 204);
      assert.equal((await http().get(body.caminho)).status, 404);
    });
  });

  describe('integridade com usuários e jogos', () => {
    it('remover o usuário apaga as mídias dele do banco e do disco', async () => {
      const conta = await criarConta();
      const a = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Primeira' });
      const b = await postar(conta, MP4, 'b.mp4', 'video/mp4', { titulo: 'Segunda' });
      assert.equal((await http().delete(`/api/usuarios/${conta.id}`).set(conta.auth)).status, 204);
      for (const midia of [a.body, b.body]) {
        assert.equal((await http().get(`/api/midias/${midia.id_midia}`)).status, 404);
        assert.equal((await http().get(midia.caminho)).status, 404);
      }
    });

    it('remover o jogo mantém a mídia, só sem o vínculo com o jogo', async () => {
      const admin = await loginAdmin();
      const conta = await criarConta();
      const jogo = await http().post('/api/jogos').set(admin.auth).send({
        nome_jogo: `Jogo Mídia ${sufixo()}`, desenvolvedora: 'Teste', data_lancamento: '2024-01-01', descricao: 'Jogo temporário.',
      });
      const { body } = await postar(conta, PNG, 'a.png', 'image/png', { titulo: 'Do jogo temporário', id_jogo_fk: String(jogo.body.id_jogo) });
      assert.equal(body.id_jogo_fk, jogo.body.id_jogo);

      assert.equal((await http().delete(`/api/jogos/${jogo.body.id_jogo}`).set(admin.auth)).status, 204);
      const depois = await http().get(`/api/midias/${body.id_midia}`);
      assert.equal(depois.status, 200);
      assert.equal(depois.body.id_jogo_fk, null);
      assert.equal(depois.body.nome_jogo, null);
      assert.equal((await http().get(body.caminho)).status, 200);
    });
  });
});
