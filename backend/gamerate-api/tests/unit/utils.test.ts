import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it, mock } from 'node:test';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import HttpError from '@/errors/HttpError.ts';
import SendMail from '@/services/SendMail.ts';
import { fromDateOnly, toDateOnly } from '@/utils/dates.ts';
import { signToken, verifyToken } from '@/utils/jwt.ts';
import { hashPassword, verifyPassword } from '@/utils/password.ts';
import {
  ALLOWED_MIDIA_TYPES, ALLOWED_MIME_TYPES, AVATAR_DIR, AVATAR_PUBLIC_PREFIX, MIDIA_DIR, MIDIA_PUBLIC_PREFIX,
  detectMediaKind, ensureUploadDirs, hasImageSignature, removeAvatarByPublicPath, removeFileQuietly,
  removeMidiaByPublicPath, toPublicAvatarPath, toPublicMidiaPath, UPLOAD_ROOT,
} from '@/utils/uploads.ts';

// Funções utilitárias isoladas: sem servidor, sem banco, sem rede.

describe('dates', () => {
  it('toDateOnly devolve só a data (YYYY-MM-DD) em UTC', () => {
    assert.equal(toDateOnly(new Date('2026-10-12T23:59:59.999Z')), '2026-10-12');
  });

  it('fromDateOnly gera meia-noite UTC e faz ida e volta com toDateOnly', () => {
    const d = fromDateOnly('2024-02-29');
    assert.equal(d.toISOString(), '2024-02-29T00:00:00.000Z');
    assert.equal(toDateOnly(d), '2024-02-29');
  });

  it('fromDateOnly com texto inválido ou vazio produz Invalid Date (borda)', () => {
    assert.ok(Number.isNaN(fromDateOnly('não é data').getTime()));
    assert.ok(Number.isNaN(fromDateOnly('').getTime()));
  });

  it('toDateOnly lança RangeError para Invalid Date', () => {
    assert.throws(() => toDateOnly(new Date('x')), RangeError);
  });
});

describe('HttpError', () => {
  it('usa 400 como status padrão e guarda mensagem e issues', () => {
    const e = new HttpError('ruim');
    assert.equal(e.code, 400);
    assert.equal(e.message, 'ruim');
    assert.equal(e.issues, undefined);
    assert.ok(e instanceof Error);
    const comIssues = new HttpError('x', 422, [{ path: 'a', message: 'b' }]);
    assert.equal(comIssues.code, 422);
    assert.deepEqual(comIssues.issues, [{ path: 'a', message: 'b' }]);
  });
});

describe('jwt', () => {
  it('assina e verifica, devolvendo sub e perfil', () => {
    const token = signToken({ sub: 7, perfil: 'Jogador' });
    assert.deepEqual(verifyToken(token), { sub: 7, perfil: 'Jogador' });
  });

  it('rejeita token vazio, lixo e adulterado com 401', () => {
    const valido = signToken({ sub: 1, perfil: 'Jogador' });
    const adulterado = `${valido.slice(0, -2)}xx`;
    for (const token of ['', 'abc', 'a.b.c', adulterado]) {
      assert.throws(() => verifyToken(token), (e: unknown) => e instanceof HttpError && e.code === 401, `token "${token}"`);
    }
  });

  it('rejeita token expirado e token assinado com outro segredo', () => {
    const expirado = jwt.sign({ sub: 1, perfil: 'Jogador' }, process.env.JWT_SECRET!, { expiresIn: -10 });
    const outroSegredo = jwt.sign({ sub: 1, perfil: 'Jogador' }, 'outro-segredo');
    for (const token of [expirado, outroSegredo]) {
      assert.throws(() => verifyToken(token), (e: unknown) => e instanceof HttpError && e.code === 401);
    }
  });

  it('rejeita payload em formato inesperado (sub como texto, perfil ausente)', () => {
    const segredo = process.env.JWT_SECRET!;
    for (const payload of [{ sub: '1', perfil: 'Jogador' }, { sub: 1 }]) {
      assert.throws(() => verifyToken(jwt.sign(payload, segredo)), (e: unknown) => e instanceof HttpError && e.code === 401);
    }
  });
});

describe('password (Argon2id)', () => {
  it('gera hash argon2id, diferente da senha, e valida a senha correta', async () => {
    const hash = await hashPassword('minha-senha');
    assert.match(hash, /^\$argon2id\$/);
    assert.notEqual(hash, 'minha-senha');
    assert.equal(await verifyPassword(hash, 'minha-senha'), true);
  });

  it('senha errada ou com diferença de maiúscula não confere', async () => {
    const hash = await hashPassword('Senha123');
    assert.equal(await verifyPassword(hash, 'senha123'), false);
    assert.equal(await verifyPassword(hash, ''), false);
  });

  it('o mesmo texto gera hashes diferentes (salt aleatório)', async () => {
    assert.notEqual(await hashPassword('igual'), await hashPassword('igual'));
  });

  it('hash malformado (ex.: senha legada em texto puro) retorna false em vez de lançar', async () => {
    assert.equal(await verifyPassword('texto-puro', 'texto-puro'), false);
    assert.equal(await verifyPassword('', 'x'), false);
  });

  it('aceita senha com acentos e emoji (encoding UTF-8)', async () => {
    const senha = 'sênhä-çom-🔐';
    assert.equal(await verifyPassword(await hashPassword(senha), senha), true);
  });
});

describe('uploads utils', () => {
  const criados: string[] = [];
  const escrever = (nome: string, bytes: Buffer | string) => {
    const arquivo = path.join(AVATAR_DIR, nome);
    fs.writeFileSync(arquivo, bytes);
    criados.push(arquivo);
    return arquivo;
  };

  before(() => ensureUploadDirs());
  after(() => { for (const f of criados) fs.rmSync(f, { force: true }); });

  it('allowlist contém só JPEG, PNG e GIF com extensões fixas', () => {
    assert.deepEqual(ALLOWED_MIME_TYPES, { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif' });
  });

  it('monta o caminho público com o prefixo de avatares', () => {
    assert.equal(toPublicAvatarPath('abc.png'), `${AVATAR_PUBLIC_PREFIX}/abc.png`);
  });

  it('ensureUploadDirs cria a estrutura de pastas', () => {
    assert.ok(fs.statSync(AVATAR_DIR).isDirectory());
    assert.ok(AVATAR_DIR.startsWith(UPLOAD_ROOT));
  });

  it('reconhece a assinatura de PNG, JPEG e GIF (87a e 89a)', async () => {
    const png = escrever('t-a.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]));
    const jpg = escrever('t-b.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]));
    const gif87 = escrever('t-c.gif', 'GIF87a......');
    const gif89 = escrever('t-d.gif', 'GIF89a......');
    for (const f of [png, jpg, gif87, gif89]) assert.equal(await hasImageSignature(f), true, f);
  });

  it('recusa texto, HTML, PDF e arquivo vazio mesmo com extensão de imagem (MIME forjado)', async () => {
    const html = escrever('t-e.png', '<html></html>');
    const pdf = escrever('t-f.png', '%PDF-1.4 ....');
    const vazio = escrever('t-g.png', '');
    const curto = escrever('t-h.png', Buffer.from([0x89, 0x50]));
    for (const f of [html, pdf, vazio, curto]) assert.equal(await hasImageSignature(f), false, f);
  });

  it('hasImageSignature falha (rejeita) para arquivo inexistente', async () => {
    await assert.rejects(() => hasImageSignature(path.join(AVATAR_DIR, 'nao-existe.png')));
  });

  it('removeAvatarByPublicPath apaga o arquivo da pasta de avatares', async () => {
    const f = escrever('t-i.png', 'x');
    await removeAvatarByPublicPath(toPublicAvatarPath('t-i.png'));
    assert.equal(fs.existsSync(f), false);
  });

  it('removeAvatarByPublicPath ignora caminhos fora do prefixo e não escapa da pasta (path traversal)', async () => {
    const fora = path.join(UPLOAD_ROOT, 't-fora.txt');
    fs.writeFileSync(fora, 'x');
    criados.push(fora);
    await removeAvatarByPublicPath('/outro/prefixo/t-fora.txt');
    await removeAvatarByPublicPath(`${AVATAR_PUBLIC_PREFIX}/../t-fora.txt`);
    await removeAvatarByPublicPath('');
    assert.equal(fs.existsSync(fora), true, 'arquivo fora de avatars/ não pode ser apagado');
  });

  it('removeFileQuietly não lança para arquivo inexistente', async () => {
    await assert.doesNotReject(() => removeFileQuietly(path.join(AVATAR_DIR, 'fantasma.png')));
  });

  it('removeFileQuietly registra erro inesperado (não ENOENT) sem lançar', async () => {
    const erro = mock.method(console, 'error', () => {});
    // unlink em um diretório falha com EISDIR/EPERM, não com ENOENT.
    await assert.doesNotReject(() => removeFileQuietly(AVATAR_DIR));
    assert.equal(erro.mock.callCount(), 1);
    erro.mock.restore();
  });
});

describe('uploads utils: mídias de gameplay', () => {
  const criados: string[] = [];
  const escrever = (nome: string, bytes: Buffer | string, dir = MIDIA_DIR) => {
    const arquivo = path.join(dir, nome);
    fs.writeFileSync(arquivo, bytes);
    criados.push(arquivo);
    return arquivo;
  };

  before(() => ensureUploadDirs());
  after(() => { for (const f of criados) fs.rmSync(f, { force: true }); });

  it('allowlist de mídias mapeia MIME -> extensão fixa e tipo lógico (imagem/vídeo)', () => {
    assert.deepEqual(ALLOWED_MIDIA_TYPES['image/png'], { extensao: '.png', tipo: 'imagem' });
    assert.deepEqual(ALLOWED_MIDIA_TYPES['video/mp4'], { extensao: '.mp4', tipo: 'video' });
    assert.deepEqual(ALLOWED_MIDIA_TYPES['video/webm'], { extensao: '.webm', tipo: 'video' });
    assert.equal(ALLOWED_MIDIA_TYPES['application/pdf'], undefined);
  });

  it('monta o caminho público das mídias e cria a pasta uploads/midias', () => {
    assert.equal(toPublicMidiaPath('x.mp4'), `${MIDIA_PUBLIC_PREFIX}/x.mp4`);
    assert.ok(fs.statSync(MIDIA_DIR).isDirectory());
  });

  it('detectMediaKind reconhece imagens (JPEG, PNG, GIF, WebP) pelos primeiros bytes', async () => {
    const jpg = escrever('k-a.bin', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const png = escrever('k-b.bin', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]));
    const gif = escrever('k-c.bin', 'GIF89a......');
    const webp = escrever('k-d.bin', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]));
    for (const f of [jpg, png, gif, webp]) assert.equal(await detectMediaKind(f), 'imagem', f);
  });

  it('detectMediaKind reconhece vídeos (MP4 com "ftyp" e WebM/Matroska)', async () => {
    const mp4 = escrever('k-e.bin', Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42'), Buffer.alloc(4)]));
    const webm = escrever('k-f.bin', Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]));
    assert.equal(await detectMediaKind(mp4), 'video');
    assert.equal(await detectMediaKind(webm), 'video');
  });

  it('detectMediaKind devolve null para HTML, PDF, RIFF que não é WebP e arquivo vazio', async () => {
    const html = escrever('k-g.bin', '<html>x</html>');
    const pdf = escrever('k-h.bin', '%PDF-1.4 ...');
    const wav = escrever('k-i.bin', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')]));
    const vazio = escrever('k-j.bin', '');
    for (const f of [html, pdf, wav, vazio]) assert.equal(await detectMediaKind(f), null, f);
  });

  it('removeMidiaByPublicPath apaga o arquivo da pasta de mídias', async () => {
    const f = escrever('k-k.mp4', 'x');
    await removeMidiaByPublicPath(toPublicMidiaPath('k-k.mp4'));
    assert.equal(fs.existsSync(f), false);
  });

  it('removeMidiaByPublicPath ignora prefixo estranho e não escapa da pasta (path traversal)', async () => {
    const avatar = escrever('k-l.png', 'x', AVATAR_DIR);
    const fora = escrever('k-fora.txt', 'x', UPLOAD_ROOT);
    await removeMidiaByPublicPath(toPublicAvatarPath('k-l.png'));          // prefixo de outra pasta
    await removeMidiaByPublicPath(`${MIDIA_PUBLIC_PREFIX}/../k-fora.txt`); // tentativa de sair da pasta
    await removeMidiaByPublicPath('');
    assert.equal(fs.existsSync(avatar), true);
    assert.equal(fs.existsSync(fora), true);
  });
});

describe('SendMail com SMTP_DISABLED=true', () => {
  it('serializa a mensagem em memória: não cria conta Ethereal nem usa a rede', async () => {
    assert.equal(process.env.SMTP_DISABLED, 'true');
    const criarConta = mock.method(nodemailer, 'createTestAccount');
    const log = mock.method(console, 'log', () => {});
    await assert.doesNotReject(() => SendMail.enviarEmailBoasVindas('alguem@example.test', 'Alguém'));
    assert.equal(criarConta.mock.callCount(), 0);
    criarConta.mock.restore();
    log.mock.restore();
  });
});
