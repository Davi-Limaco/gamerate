# Upload de arquivos — Foto de perfil (GameRate)

Documentação de apoio à apresentação da atividade "Upload de arquivos em uma
aplicação Web integrada ao back-end Node.js/Express". O usuário autenticado
envia **uma foto de perfil (avatar)**; ela é gravada em disco, associada ao
usuário no banco e exibida no cabeçalho, no perfil e nas avaliações.

## Caminho de um arquivo (do formulário ao disco e ao banco)

```
perfil.html  <input type="file" name="imagem">
   │  validação rápida no cliente (tipo/tamanho) + pré-visualização local
   ▼
fetch(POST|PUT /api/usuarios/imagem, FormData, Authorization: Bearer <jwt>)
   │  (sem Content-Type manual: o navegador gera multipart + boundary)
   ▼
routes/imagem.routes.ts
   1. authenticate     -> sem token/ token inválido = 401 (corpo nem é lido)
   2. uploadAvatar     -> Multer: filtro de MIME -> limite de 2 MB -> grava em
                          uploads/avatars/<uuid>.<ext> -> confere magic bytes
   3. ImagemController -> id do usuário vem do TOKEN (req.usuario.id)
   ▼
models/imagem.model.ts  upsert por id_usuario_fk (UNIQUE): INSERT na 1ª vez,
                        UPDATE do caminho nas seguintes
   ▼
controller apaga o arquivo antigo do disco e responde { imagem, caminho }
   ▼
GET /uploads/avatars/<uuid>.png  (express.static) -> <img src> no front-end
```

## Checklist dos critérios (100 pts)

### 1. Configuração do Upload com Multer (20 pts)

| Item | Onde | Detalhe |
|---|---|---|
| Destino em disco | `src/middlewares/upload.ts` (`multer.diskStorage`) | `uploads/avatars/` (criada automaticamente ao iniciar) |
| Nome gerado pelo servidor | `filename:` em `upload.ts` | `crypto.randomUUID()` + extensão vinda da allowlist de MIME; `originalname` é ignorado (sem sobrescrita, sem `../`) |
| Limite de tamanho | `limits.fileSize` (`UPLOAD_MAX_BYTES`, padrão 2 MB) | excedeu → `MulterError LIMIT_FILE_SIZE` → **400** |
| Filtro por MIME (allowlist) | `fileFilter` + `ALLOWED_MIME_TYPES` em `src/utils/uploads.ts` | só `image/jpeg`, `image/png`, `image/gif` |
| Arquivo recusado | `fileFilter` rejeita com `HttpError 400` | o filtro roda **antes** de o Multer abrir o destino: nada é gravado. No limite de tamanho o Multer remove o arquivo parcial |
| Defesa extra | `hasImageSignature` (magic bytes) | MIME é informado pelo cliente e pode ser forjado; se o conteúdo não for JPEG/PNG/GIF, o arquivo é apagado e a resposta é 400 |

### 2. Rotas de Upload Protegidas (20 pts)

| Item | Onde |
|---|---|
| Rotas | `POST`, `PUT` e `DELETE /api/usuarios/imagem` — `src/routes/imagem.routes.ts` |
| Ordem dos middlewares | `authenticate` → `uploadAvatar` → controller. Sem token = **401** sem processar o arquivo |
| Resposta de sucesso | `POST` → **201** `{ imagem, caminho }` (ex.: `/uploads/avatars/<uuid>.png`); `PUT` → **200** |
| Erros de tamanho/tipo | `src/middlewares/errorHandlers.ts` (`MulterError` → 400 com mensagem em pt-BR; `HttpError` do filtro → 400) |
| Registro das rotas | `src/index.ts`: `imagemRoutes` **antes** de `usuariosRoutes`, senão `/usuarios/imagem` cairia em `/usuarios/:id` |

### 3. Persistência e Associação ao Usuário (20 pts)

| Item | Onde |
|---|---|
| Model `Imagem` | `prisma/schema.prisma` — `id_usuario_fk Int @unique` + relação 1:1 com `Usuario` (`onDelete: Cascade`) |
| Migration | `prisma/migrations/20261012120000_add_imagem/migration.sql` |
| Um arquivo por usuário | `@unique` no banco + `upsert` em `imagem.model.ts` (novo envio atualiza o caminho) |
| Limpeza de disco | controller apaga o arquivo antigo após o upsert, o novo se o banco falhar, e `usuario.model.ts#remove` apaga a foto ao excluir o usuário |
| Pasta como conteúdo estático | `src/index.ts`: `app.use('/uploads', express.static(...))` (`nosniff`, sem dotfiles/índice) |
| Fora do versionamento | `.gitignore` + `uploads/.gitignore` + `uploads/avatars/.gitignore`: o conteúdo é ignorado, a estrutura é versionada (e a API recria as pastas ao subir) |

### 4. Testes das Rotas de Upload (20 pts)

`request.http`, seção **UPLOAD**, com arquivos em `test-files/`:

| Caso | Esperado |
|---|---|
| Envio sem token (e com token inválido) | 401 |
| Envio válido (`avatar.png`) | 201 + caminho |
| `GET` no caminho devolvido | 200, imagem exibida |
| `grande.png` (3 MB) | 400 |
| `documento.pdf` | 400 |
| `falso.png` (HTML com MIME `image/png`) | 400 |
| Campo com nome errado / sem arquivo | 400 |
| Reenvio com `PUT` (`avatar2.png`) | 200, caminho novo; caminho antigo vira 404 |
| `DELETE` (e repetir) | 204 / 404 |

No multipart, o token vai em `Authorization: Bearer {{jogadorLogin.response.body.token}}`
e o arquivo é uma parte `name="imagem"` com o conteúdo lido por `< ./test-files/arquivo`.

### 5. Upload e Exibição no Front-end (20 pts)

| Item | Onde |
|---|---|
| Formulário `<input type="file">` | `public/pages/perfil.html` (modal "Foto de perfil") |
| Envio com `FormData` + `fetch` | `perfil.html` (submit de `#fotoForm`) → `api.upload()` em `public/js/api.js`, que **não** define `Content-Type` para `FormData` |
| Token na requisição | `apiFetch` inclui `Authorization: Bearer <jwt>` |
| Pré-visualização | `URL.createObjectURL` antes de enviar |
| Erros de tamanho e tipo | validação no cliente + mensagem do servidor (`err.message`) exibida no modal |
| Uso nas demais telas | `avatarHtml()` (api.js): cabeçalho de todas as páginas, perfil, avaliações (home, jogo e página da avaliação). Sem foto, mostra iniciais |

## Variáveis de ambiente

```
UPLOAD_DIR="uploads"        # pasta raiz (relativa à pasta da API)
UPLOAD_MAX_BYTES=2097152    # limite por arquivo (2 MB)
```

## Perguntas e respostas

**Por que não usar o nome do arquivo enviado?** Ele é controlado pelo cliente:
poderia conter `../`, extensão enganosa (`foto.php.png`) ou repetir o nome de
outro usuário e sobrescrever o arquivo dele.

**Por que `authenticate` antes do Multer?** O Multer grava em disco enquanto lê
o corpo. Autenticando antes, quem não tem token recebe 401 sem que nenhum byte
seja processado.

**Por que conferir os magic bytes se já há filtro de MIME?** O `mimetype` vem do
cliente e é forjável. A assinatura do conteúdo não.

**Como garante um arquivo por usuário?** `id_usuario_fk` é `UNIQUE` e o model usa
`upsert`: o segundo envio atualiza a mesma linha em vez de criar outra.

**E o arquivo antigo?** É removido do disco depois que o banco aponta para o novo.
Se o banco falhar, o arquivo recém-enviado é que é removido.


---

# Extensão: gameplays (prints e vídeos) e jogos favoritos no perfil

Na página de perfil o usuário também **posta prints e vídeos de gameplay** e
**favorita jogos que já existem no banco**. Reaproveita todo o desenho do
upload do avatar (Multer em disco, nome gerado pelo servidor, allowlist de MIME,
limite de tamanho, magic bytes, autenticação antes do Multer, arquivos estáticos
em `/uploads`, `.gitignore`).

## Caminho de um gameplay (do formulário ao disco e ao banco)

```
perfil.html  modal "Postar gameplay": <input type="file" name="arquivo"> + título,
   │         jogo (select com os jogos do banco) e descrição
   │  validação rápida no cliente (tipo/tamanho) + pré-visualização (<img> ou <video>)
   ▼
fetch(POST /api/midias, FormData, Authorization: Bearer <jwt>)   (sem Content-Type manual)
   ▼
routes/midias.routes.ts
   1. authenticate   -> sem token = 401, o corpo nem é lido
   2. uploadMidia    -> Multer: filtro de MIME -> limite (30 MB) -> grava em
                        uploads/midias/<uuid>.<ext> -> confere magic bytes e o TIPO REAL
   3. validate       -> Zod nos campos de texto (título 3-100, descrição ≤ 500, jogo opcional)
   4. MidiasController -> autor vem do TOKEN; `tipo` ('imagem'/'video') vem do conteúdo
   ▼
models/midia.model.ts  -> tabela `midia` (usuário 1:N, jogo opcional)
   ▼
qualquer erro depois do Multer (campos inválidos, jogo inexistente, banco) apaga o
arquivo gravado: errorHandlers.ts, em um único lugar
   ▼
GET /uploads/midias/<uuid>.mp4  (express.static, com suporte a Range para o player)
```

| Item | Onde |
|---|---|
| Multer das mídias | `src/middlewares/uploadMidia.ts` (campo `arquivo`; JPEG, PNG, GIF, WebP, MP4, WebM; 30 MB via `UPLOAD_MIDIA_MAX_BYTES`) |
| Allowlist e magic bytes | `src/utils/uploads.ts` (`ALLOWED_MIDIA_TYPES`, `detectMediaKind`) |
| Rotas | `POST/GET /api/midias`, `GET/PUT/DELETE /api/midias/:id` — `src/routes/midias.routes.ts` |
| Proteção | `authenticate` antes do Multer; `PUT/DELETE` só autor ou administrador (`requireMidiaOwnerOrAdmin`) |
| Banco | `model Midia` em `schema.prisma` + migration `20261019120000_add_favorito_midia` |
| Limpeza de disco | excluir a mídia ou o usuário apaga o arquivo; excluir o jogo mantém a mídia (`onDelete: SetNull`) |
| Pasta fora do git | `uploads/midias/.gitignore` (+ `uploads/.gitignore` e `.gitignore`) |

## Favoritos

| Item | Onde |
|---|---|
| Rotas (sempre do usuário do token) | `GET/POST /api/favoritos`, `DELETE /api/favoritos/:id_jogo` — `src/routes/favoritos.routes.ts` |
| Banco | `model Favorito`: `@@unique([id_usuario_fk, id_jogo_fk])` impede duplicados (409); `onDelete: Cascade` |
| Regras | jogo inexistente = 404; já favoritado = 409; ninguém lê nem altera favoritos de outra pessoa |

## Front-end (`public/pages/perfil.html`)

- **Jogos Favoritos:** grade de capas com remoção; modal "Adicionar favorito" com busca nos jogos do banco.
- **Meus Gameplays:** galeria com `<img>` (print, abre em nova aba) e `<video controls>`; modal "Postar gameplay"
  com pré-visualização, erros de tipo/tamanho e erros por campo vindos do servidor; botão de excluir.
- Envio com `FormData` + `api.upload()` (sem `Content-Type` manual, token no `Authorization`).

## Testes (`request.http`, seções MÍDIA e FAVORITO)

Arquivos em `test-files/`: `print.jpg`, `gameplay.mp4`, `gameplay.webm`; o arquivo acima do limite
é gerado por `node test-files/gerar-midia-grande.mjs`. Casos: sem token (401), print (201), vídeo (201),
caminho acessível, PDF (400), MIME forjado (400), arquivo grande (400), campos inválidos (400),
galeria e filtros, edição, exclusão (204), favoritar (201), duplicado (409), jogo inexistente (404).

## Perguntas e respostas (extensão)

**Como o servidor sabe se é print ou vídeo?** Pelo conteúdo (magic bytes), não pelo que o cliente diz;
se o conteúdo não bate com o MIME declarado, o arquivo é apagado e a resposta é 400.

**E se os campos de texto forem inválidos depois de o arquivo já ter sido gravado?** O middleware de erros
apaga o arquivo (`req.file`): o Multer precisa rodar antes do `validate` porque os campos só existem
em `req.body` depois dele.

**Por que a mídia não some se o jogo for removido?** `id_jogo_fk` é opcional com `ON DELETE SET NULL`:
o conteúdo é do usuário. Já os favoritos são só uma relação usuário-jogo, então caem em cascata.
