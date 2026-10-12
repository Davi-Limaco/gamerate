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
