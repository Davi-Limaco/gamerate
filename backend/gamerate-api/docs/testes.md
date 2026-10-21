# Testes automatizados — GameRate

O comportamento da aplicação não muda: os testes garantem que ele continua
valendo depois da próxima alteração. Há quatro tipos, mais cobertura com piso.

## Como executar

```bash
npm install
npx playwright install chromium   # uma vez (só para o E2E)

npm test              # unidade + rotas (rápido: rode a cada alteração)
npm run front:test    # front-end (Vitest + JSDOM)
npm run e2e           # ponta a ponta (Playwright; sobe o servidor sozinho)
npm run coverage      # cobertura do servidor e do front-end, com piso
npm run test:all      # tudo
```

Também existem `test:unit` (sem banco), `test:routes`, `coverage:server`,
`front:coverage` e `typecheck`.

## Rápidos x completos

| Tipo | Ferramenta | Arquivos | Precisa de | Quando rodar |
|---|---|---|---|---|
| Unidade | `node:test` | `tests/unit/` | nada (sem servidor, banco ou rede) | a cada alteração |
| Rotas | `node:test` + `supertest` | `tests/routes/` | SQLite descartável | a cada alteração |
| Front-end | Vitest + JSDOM | `tests/front/` | nada (fetch e localStorage são dublês) | a cada alteração |
| E2E | Playwright | `tests/e2e/` | navegador + servidor real | antes de entregar / no CI |

Os três primeiros rodam em segundos. O E2E é mais lento (navegador de verdade),
por isso fica à parte.

## O que cada tipo garante

**Unidade (20 pts)** — funções puras, isoladas: schemas Zod (válido, inválido,
vazio, bordas de tamanho, data 29/02), `dates`, `jwt` (adulterado, expirado,
outro segredo), `password` (Argon2id, hash malformado, UTF-8), utilitários de
upload (magic bytes, path traversal), `HttpError` e middlewares
(`authenticate`, `authorize`, `validate`, `errorHandlers`...) com req/res falsos. Também schemas de mídia e favorito,
`detectMediaKind` (JPEG/PNG/GIF/WebP/MP4/WebM, HTML e arquivo vazio) e a limpeza de arquivos órfãos.

**Rotas (20 pts)** — `src/app.ts` exporta o `app` e `src/index.ts` só chama
`listen`; o supertest usa o `app` sem abrir porta. Cobrem criação, consulta,
atualização e remoção, erros 400/401/403/404/409 e a regra crítica de
autorização: um usuário não lê, altera nem remove dados de outro (403), nem
edita avaliação, mídia ou favorito alheio; o cadastro ignora `id_perfil_fk` (ninguém vira admin).
Repetível: cada teste cria dados com e-mail/nome únicos e `npm test` recria o
banco `src/database/test.sqlite` (migrations + seed). Nenhum e-mail real: o
`SMTP_DISABLED=true` usa o `jsonTransport` do Nodemailer (só em memória) e os
testes de cadastro trocam `SendMail.enviarEmailBoasVindas` por um dublê.

**Front-end (20 pts)** — `tests/front/api.test.js` testa `public/js/api.js` sem
navegador, com `fetch` e `localStorage` substituídos por dublês: URL, método,
cabeçalho `Authorization`, ausência de `Content-Type` em `FormData` (upload),
sucesso, erros 400/401/403/404, falha de rede, sessão, `setupNav`, `toast` e os
avatares (inclusive escape contra XSS).

**E2E (20 pts)** — `tests/e2e/fluxos.spec.ts`, com localizadores por papel
(`getByRole`, `getByLabel`) e dados únicos por execução: cadastro pelo
formulário, avaliação de um jogo e conferência na tela; erro de e-mail
duplicado e de login; redirecionamento de visitante; envio, persistência e
remoção da foto de perfil; erros de tipo e tamanho; favoritar e desfavoritar jogos; postar print e vídeo de gameplay,
vê-los na galeria, excluir, e erros de tipo, arquivo ausente e título curto. `playwright.config.ts`
define o `webServer` (`npm run e2e:server`: recria o banco `e2e.sqlite` e sobe
a API na porta 3100 com `tests/env/e2e.env`).

**Cobertura (20 pts)**

| Relatório | Comando | Piso (falha se ficar abaixo) |
|---|---|---|
| Servidor (c8) — `coverage/server/index.html` + tabela com linhas não cobertas por arquivo | `npm run coverage:server` | linhas/statements/funções 90%, branches 78% (`.c8rc.json`) |
| Front-end (v8) — `coverage/front/index.html` | `npm run front:coverage` | linhas/statements/funções 90%, branches 85% (`vitest.config.ts`) |

Para ver o piso agir, aumente um valor (ex.: `"lines": 99`) e rode
`npm run coverage:server`: o comando termina com erro.

## O que mudou na aplicação para ser testável

- `src/app.ts` (novo): o `app` montado e exportado; `src/index.ts` ficou só com o `listen`.
- `SendMail.ts`: com `SMTP_DISABLED=true` usa `jsonTransport` (3 linhas).
- `app.ts`: o log do `morgan` é pulado com `NODE_ENV=test`.
- `public/js/api.js`: 7 linhas no fim expõem as funções quando
  `globalThis.__GAMERATE_EXPORTS__` existe (no navegador não faz nada).
- `login.html` e `jogo.html`: `<label>` ganharam `for=` (acessibilidade; permite `getByLabel`).

## Variáveis de ambiente de teste

`tests/env/test.env` (unidade/rotas) e `tests/env/e2e.env` (E2E): banco, segredo
JWT e pasta de uploads próprios, `SMTP_DISABLED=true`, `NODE_ENV=test`. Nenhum
segredo real; não afetam o `.env` de desenvolvimento.

## Cobertura das funcionalidades de perfil

`tests/routes/midias.routes.test.ts` (upload de print e vídeo, Range, tipos e tamanho, MIME forjado, arquivo apagado em
qualquer falha, galeria e filtros, edição, exclusão, moderação, remoção de usuário e de jogo) e
`tests/routes/favoritos.routes.test.ts` (201, 409, 404, 400, isolamento entre usuários, ordem, cascade ao remover o jogo).
O limite de mídia nos testes é 1 MB (`UPLOAD_MIDIA_MAX_BYTES` em `tests/env/test.env`), para o caso "grande demais" não precisar de 30 MB.
