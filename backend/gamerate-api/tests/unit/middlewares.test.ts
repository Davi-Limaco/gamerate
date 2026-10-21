import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, mock } from 'node:test';
import multer from 'multer';
import { z } from 'zod';

import HttpError from '@/errors/HttpError.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { authorize } from '@/middlewares/authorize.ts';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandlers.ts';
import { requireJsonContentType } from '@/middlewares/requireJsonContentType.ts';
import { requireOwnerOrAdmin } from '@/middlewares/requireOwnerOrAdmin.ts';
import { validate } from '@/middlewares/validate.ts';
import { signToken } from '@/utils/jwt.ts';
import { ensureUploadDirs, MIDIA_DIR } from '@/utils/uploads.ts';
import { fakeNext, fakeReq, fakeRes } from './helpers.ts';

// Middlewares exercitados com req/res/next falsos: nenhum servidor é aberto.

const status = (e: unknown) => e instanceof HttpError && e.code;

describe('authenticate', () => {
  it('sem header Authorization -> 401', () => {
    assert.throws(() => authenticate(fakeReq(), fakeRes(), fakeNext()), (e) => status(e) === 401);
  });

  it('header sem o esquema Bearer ou com token vazio -> 401', () => {
    for (const authorization of ['Basic abc', 'Bearer', 'Bearer   ', 'token-solto']) {
      const req = fakeReq({ headers: { authorization } });
      assert.throws(() => authenticate(req, fakeRes(), fakeNext()), (e) => status(e) === 401, authorization);
    }
  });

  it('token inválido -> 401', () => {
    const req = fakeReq({ headers: { authorization: 'Bearer lixo.lixo.lixo' } });
    assert.throws(() => authenticate(req, fakeRes(), fakeNext()), (e) => status(e) === 401);
  });

  it('token válido preenche req.usuario e chama next()', () => {
    const req = fakeReq({ headers: { authorization: `Bearer ${signToken({ sub: 5, perfil: 'Administrador' })}` } });
    const next = fakeNext();
    authenticate(req, fakeRes(), next);
    assert.deepEqual(req.usuario, { id: 5, perfil: 'Administrador' });
    assert.equal(next.calls.length, 1);
  });
});

describe('authorize', () => {
  it('sem req.usuario -> 401', () => {
    assert.throws(() => authorize('Administrador')(fakeReq(), fakeRes(), fakeNext()), (e) => status(e) === 401);
  });

  it('perfil fora da lista -> 403; dentro da lista -> next()', () => {
    const jogador = fakeReq({ usuario: { id: 1, perfil: 'Jogador' } });
    assert.throws(() => authorize('Administrador')(jogador, fakeRes(), fakeNext()), (e) => status(e) === 403);
    const next = fakeNext();
    authorize('Administrador', 'Moderador')(fakeReq({ usuario: { id: 1, perfil: 'Moderador' } }), fakeRes(), next);
    assert.equal(next.calls.length, 1);
  });

  it('lista vazia de perfis nega todo mundo (falha segura)', () => {
    const req = fakeReq({ usuario: { id: 1, perfil: 'Administrador' } });
    assert.throws(() => authorize()(req, fakeRes(), fakeNext()), (e) => status(e) === 403);
  });
});

describe('requireOwnerOrAdmin', () => {
  const chamar = (usuario: unknown, id: string) => {
    const next = fakeNext();
    const run = () => requireOwnerOrAdmin(fakeReq({ usuario, params: { id } }) as never, fakeRes(), next);
    return { run, next };
  };

  it('o dono do recurso passa', () => {
    const { run, next } = chamar({ id: 4, perfil: 'Jogador' }, '4');
    run();
    assert.equal(next.calls.length, 1);
  });

  it('outro usuário comum leva 403 (usuário não acessa dados de outro)', () => {
    const { run } = chamar({ id: 4, perfil: 'Jogador' }, '5');
    assert.throws(run, (e) => status(e) === 403);
  });

  it('administrador acessa recurso de qualquer usuário', () => {
    const { run, next } = chamar({ id: 1, perfil: 'Administrador' }, '99');
    run();
    assert.equal(next.calls.length, 1);
  });

  it('sem autenticação -> 401', () => {
    const { run } = chamar(undefined, '1');
    assert.throws(run, (e) => status(e) === 401);
  });
});

describe('requireJsonContentType', () => {
  it('rejeita Content-Type ausente ou diferente de application/json', () => {
    for (const headers of [{}, { 'content-type': 'text/plain' }, { 'content-type': 'multipart/form-data' }]) {
      assert.throws(() => requireJsonContentType(fakeReq({ headers }), fakeRes(), fakeNext()), (e) => status(e) === 400);
    }
  });

  it('aceita application/json', () => {
    const next = fakeNext();
    requireJsonContentType(fakeReq({ headers: { 'content-type': 'application/json' } }), fakeRes(), next);
    assert.equal(next.calls.length, 1);
  });
});

describe('validate', () => {
  const body = z.object({ n: z.coerce.number().int(), nome: z.string().min(2) });

  it('substitui o body pelos dados validados e coagidos e segue adiante', () => {
    const req = fakeReq({ body: { n: '7', nome: 'ok', extra: 'descartado' } });
    const next = fakeNext();
    validate({ body })(req, fakeRes(), next);
    assert.deepEqual(req.body, { n: 7, nome: 'ok' });
    assert.deepEqual(next.calls, [[]]);
  });

  it('entrada inválida vira HttpError 400 com issues por campo', () => {
    const next = fakeNext();
    validate({ body })(fakeReq({ body: { n: 'x', nome: '' } }), fakeRes(), next);
    const erro = next.calls[0]![0] as HttpError;
    assert.equal(erro.code, 400);
    assert.equal(erro.message, 'Dados inválidos na requisição');
    assert.deepEqual(erro.issues?.map((i) => i.path).sort(), ['n', 'nome']);
  });

  it('issue na raiz usa o caminho "(raiz)"', () => {
    const next = fakeNext();
    validate({ body: z.string() })(fakeReq({ body: 5 }), fakeRes(), next);
    assert.equal((next.calls[0]![0] as HttpError).issues?.[0]?.path, '(raiz)');
  });

  it('valida params e query (query é redefinida com os dados coagidos)', () => {
    const req = fakeReq({ params: { id: '3' }, query: { page: '2' } });
    const next = fakeNext();
    validate({ params: z.object({ id: z.coerce.number() }), query: z.object({ page: z.coerce.number() }) })(req, fakeRes(), next);
    assert.deepEqual(req.params, { id: 3 });
    assert.deepEqual(req.query, { page: 2 });
    assert.deepEqual(next.calls, [[]]);
  });

  it('erros que não são do Zod são repassados sem alteração', () => {
    const boom = new Error('inesperado');
    const next = fakeNext();
    validate({ body: { parse: () => { throw boom; } } as never })(fakeReq(), fakeRes(), next);
    assert.equal(next.calls[0]![0], boom);
  });
});

describe('errorHandlers', () => {
  it('notFoundHandler responde 404', () => {
    const res = fakeRes();
    notFoundHandler(fakeReq(), res, fakeNext());
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Content Not Found' });
  });

  it('HttpError usa o próprio status e inclui issues só quando existem', () => {
    const a = fakeRes();
    errorHandler(new HttpError('conflito', 409), fakeReq(), a, fakeNext());
    assert.equal(a.statusCode, 409);
    assert.deepEqual(a.body, { error: 'conflito' });

    const b = fakeRes();
    errorHandler(new HttpError('inválido', 400, [{ path: 'x', message: 'y' }]), fakeReq(), b, fakeNext());
    assert.deepEqual(b.body, { error: 'inválido', issues: [{ path: 'x', message: 'y' }] });
  });

  it('erros do Multer viram 400 com mensagem clara em pt-BR e o código original', () => {
    const casos: Array<[ConstructorParameters<typeof multer.MulterError>[0], RegExp]> = [
      ['LIMIT_FILE_SIZE', /muito grande.*2 MB/],
      ['LIMIT_UNEXPECTED_FILE', /campo de arquivo inesperado/i],
      ['LIMIT_FILE_COUNT', /apenas um arquivo/i],
      ['LIMIT_PART_COUNT', /Falha no envio do arquivo \(LIMIT_PART_COUNT\)/],
    ];
    for (const [code, regex] of casos) {
      const res = fakeRes();
      errorHandler(new multer.MulterError(code), fakeReq(), res, fakeNext());
      assert.equal(res.statusCode, 400, code);
      const corpo = res.body as { error: string; code: string };
      assert.match(corpo.error, regex);
      assert.equal(corpo.code, code);
    }
  });

  it('o limite de tamanho citado depende do campo: "arquivo" (mídias) usa o limite das mídias, "imagem" o do avatar', () => {
    const midia = fakeRes();
    errorHandler(Object.assign(new multer.MulterError('LIMIT_FILE_SIZE', 'arquivo')), fakeReq(), midia, fakeNext());
    assert.match((midia.body as { error: string }).error, /máximo é 1 MB/); // UPLOAD_MIDIA_MAX_BYTES do ambiente de teste

    const avatar = fakeRes();
    errorHandler(new multer.MulterError('LIMIT_FILE_SIZE', 'imagem'), fakeReq(), avatar, fakeNext());
    assert.match((avatar.body as { error: string }).error, /máximo é 2 MB/);
  });

  it('erros de campos de texto do multipart viram 400 com mensagem própria', () => {
    for (const code of ['LIMIT_FIELD_COUNT', 'LIMIT_FIELD_VALUE', 'LIMIT_FIELD_KEY'] as const) {
      const res = fakeRes();
      errorHandler(new multer.MulterError(code), fakeReq(), res, fakeNext());
      assert.equal(res.statusCode, 400);
      assert.match((res.body as { error: string }).error, /Campos do formulário/);
    }
  });

  it('qualquer erro depois do upload apaga o arquivo recém-gravado (sem órfãos em disco)', async () => {
    ensureUploadDirs();
    const arquivo = path.join(MIDIA_DIR, 'orfao-teste.png');
    fs.writeFileSync(arquivo, 'x');
    errorHandler(new HttpError('falhou depois do upload', 404), fakeReq({ file: { path: arquivo } }), fakeRes(), fakeNext());
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(fs.existsSync(arquivo), false);
  });

  it('erro desconhecido vira 500 genérico, sem vazar a mensagem interna', () => {
    const log = mock.method(console, 'error', () => {});
    const res = fakeRes();
    errorHandler(new Error('senha do banco: 1234'), fakeReq(), res, fakeNext());
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Internal Server Error' });
    assert.equal(log.mock.callCount(), 1);
    log.mock.restore();
  });
});
