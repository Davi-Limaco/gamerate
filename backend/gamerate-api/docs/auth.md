# Autenticação — GameRate

Documentação de apoio à apresentação da atividade "Autenticação (Auth) em
uma aplicação Web integrada ao back-end Node.js/Express". Ver também
`docs/apresentacao.md` (critérios da entrega anterior, CRUD/Prisma) e
`README.md` (seção "Autenticação").

## Checklist dos critérios (100 pts)

### 1. Modelagem de Usuários e Segurança das Credenciais (20 pts)

| Item | Localização | Demonstração |
|---|---|---|
| Atributos de autenticação | `prisma/schema.prisma` (`model Usuario`) | `email` (login), `senha` (hash), `id_perfil_fk` (autorização) |
| Unicidade de e-mail | `email String @unique` no schema; migration correspondente | Tentar cadastrar com e-mail já usado → 409 (`request.http`, seção AUTH) |
| Hash de senha | `src/utils/password.ts` (`hashPassword`, `verifyPassword`) | Abrir o arquivo; mostrar `argon2id` e os parâmetros OWASP |
| Senha nunca em texto puro | `usuario.model.ts` (`create`, `update`) chamam `hashPassword` antes do INSERT/UPDATE | `npx prisma studio` → coluna `senha` mostra `$argon2id$v=19$...`, nunca a senha digitada |
| Validações de cadastro | `src/schemas/usuario.schema.ts` (`cadastroBodySchema`) | Nome mínimo 3, e-mail com formato válido, senha mínimo 6 caracteres |

**Por que Argon2id e não bcrypt/scrypt?** Argon2id venceu a Password Hashing
Competition e é a recomendação atual da OWASP: junta resistência a ataques
de side-channel (como argon2i) com alto custo de memória contra hardware
dedicado — GPU/ASIC (como argon2d/scrypt). O hash gerado já embute
algoritmo, versão, parâmetros e um salt aleatório por senha; não há salt
manual para gerenciar.

### 2. Cadastro e Autenticação de Usuários (20 pts)

| Item | Localização | Demonstração |
|---|---|---|
| Rota de cadastro | `POST /auth/cadastro` — `src/routes/auth.routes.ts` | `request.http`, requests "[AUTH] Cadastrar novo usuário" |
| Rota de login | `POST /auth/login` — `src/routes/auth.routes.ts` | `request.http`, requests "[AUTH] Login válido" |
| Controller | `src/controllers/auth.controller.ts` (`cadastro`, `login`) | Seguir o fluxo: validação → `Usuario.create`/`readByEmail` → `verifyPassword` → `signToken` |
| Comparação de senha | `verifyPassword(usuario.senha, senha)` em `auth.controller.ts` | Nunca decodifica o hash — só compara |
| E-mail/login já existente | `usuario.model.ts` → erro `P2002` do Prisma → `throwPrismaError` → `HttpError(409)` | `request.http`, "[AUTH] Cadastro com e-mail já cadastrado" |
| Usuário inexistente / senha incorreta | `auth.controller.ts` (`login`) — mesma mensagem "Credenciais inválidas" (401) para os dois casos | `request.http`, "[AUTH] Login com senha incorreta" e "...e-mail inexistente" |
| Dados inválidos | `validate({ body: cadastroBodySchema })` / `loginBodySchema` | `request.http`, "[AUTH] Cadastro com corpo inválido" |

**Por que a mesma mensagem para e-mail inexistente e senha errada?** Para
não permitir *user enumeration*: se a API dissesse "e-mail não encontrado"
vs. "senha incorreta", um atacante poderia descobrir quais e-mails têm
conta cadastrada só tentando logins em massa.

### 3. Sessão/Token e Proteção de Rotas com Middleware (20 pts)

| Item | Localização | Demonstração |
|---|---|---|
| Estratégia adotada | JWT (JSON Web Token), stateless | `src/utils/jwt.ts` — `signToken`/`verifyToken` |
| Emissão do token | `auth.controller.ts` (`cadastro` e `login`) chamam `signToken({ sub, perfil })` | Resposta de login/cadastro inclui `{ token, usuario }` |
| Middleware de autenticação | `src/middlewares/authenticate.ts` | Lê `Authorization: Bearer <token>`, popula `req.usuario` |
| Middleware de autorização por perfil | `src/middlewares/authorize.ts` (`authorize('Administrador')`) | `usuarios.routes.ts`, `jogos.routes.ts`, `catalog.routes.ts`, `contato.routes.ts` |
| Middleware de dono-do-recurso | `src/middlewares/requireOwnerOrAdmin.ts` e `requireAvaliacaoOwnerOrAdmin.ts` | `usuarios.routes.ts` (`/usuarios/:id`), `avaliacoes.routes.ts` (`/avaliacoes/:id`) |
| Rota só para autenticados (mínimo exigido) | `POST /avaliacoes` — `authenticate` antes do Controller | `request.http`, seção "ROTAS PROTEGIDAS" |
| Comportamento sem autenticação | `authenticate` lança `HttpError(401)` antes do Controller rodar | Mesma seção: request sem `Authorization` → 401, nenhuma avaliação é criada |
| Comportamento com perfil errado | `authorize`/`requireOwnerOrAdmin` lançam `HttpError(403)` | `GET /usuarios` com token de "Jogador" → 403 |

**Fluxo da requisição protegida:**

```
Cliente                    Express
  │  Authorization: Bearer <token>
  ├───────────────────────────▶  authenticate
  │                                 │  token ausente/inválido? -> 401, para aqui
  │                                 │  válido -> req.usuario = { id, perfil }
  │                                 ▼
  │                              authorize / requireOwnerOrAdmin (quando a rota exige)
  │                                 │  perfil/dono não bate? -> 403, para aqui
  │                                 ▼
  │                              Controller -> Model -> Prisma -> resposta
  ◀───────────────────────────
```

**Por que JWT e não sessão com cookie?** A API já era stateless (sem
`express-session`) e o front-end é um SPA simples servido como estático;
JWT evita guardar estado de sessão no servidor (nenhuma tabela de sessões,
nenhum `store` compartilhado) e funciona igual para qualquer cliente HTTP
(browser, `request.http`, um app mobile futuro).

**Por que o token expira em poucas horas?** Um JWT não pode ser
"invalidado" no servidor sem uma lista de revogação — expirando cedo
(`JWT_EXPIRES_IN`), o estrago de um token vazado fica limitado a essa
janela, sem exigir infraestrutura extra.

### 4. Testes dos Fluxos de Autenticação e Rotas Protegidas (20 pts)

| Item | Localização | Demonstração |
|---|---|---|
| Arquivo de testes | `backend/gamerate-api/request.http` | Abrir no VS Code com a extensão REST Client |
| Cadastro | Seção "AUTH" | Requests "[AUTH] Cadastrar novo usuário", corpo inválido, e-mail duplicado |
| Autenticação válida | Seção "AUTH" | "[AUTH] Login válido (Administrador)" e "...(usuário comum)" — cada um com `# @name` para reuso do token |
| Autenticação inválida | Seção "AUTH" | "[AUTH] Login com senha incorreta", "...e-mail inexistente" |
| Rota protegida sem autenticação | Seção "ROTAS PROTEGIDAS" | "[PROTEGIDA] Publicar avaliação SEM token" → 401; "[PROTEGIDA] GET /usuarios ... SEM token" → 401 |
| Mesma rota após autenticação | Seção "ROTAS PROTEGIDAS" | "[PROTEGIDA] Publicar avaliação COM token válido" → 201; "...com token de Administrador" → 200 |
| Envio do token nas requisições seguintes | Todas as seções, header `Authorization: Bearer {{nomeDoLogin.response.body.token}}` | Sintaxe do REST Client: o `# @name` de um login/cadastro fica disponível para todo request posterior no arquivo |

**Como o encadeamento funciona:** cada request de login/cadastro tem um
`# @name` (ex.: `adminLogin`, `jogadorLogin`, `cadastroTeste`). Qualquer
request abaixo pode reaproveitar o corpo dessa resposta com
`{{adminLogin.response.body.token}}` (o JWT) ou
`{{cadastroTeste.response.body.usuario.id_usuario}}` (um campo do usuário
criado) — sem copiar e colar valores manualmente entre execuções.

### 5. Integração da Autenticação com o Front-end (20 pts)

| Item | Localização | Demonstração |
|---|---|---|
| Interface de cadastro | `frontend/pages/cadastro.html` | Validação nativa + erros da API por campo (`issues`); salva `token` e `usuario` no `localStorage` via `saveSession` |
| Interface de login | `frontend/pages/login.html` | Mesma ideia: erro de credenciais exibido, `saveSession` ao sucesso |
| Cliente HTTP centralizado | `frontend/js/api.js` (`apiFetch`) | Anexa `Authorization: Bearer <token>` automaticamente em toda chamada; em 401, limpa a sessão local |
| Identificação do usuário autenticado | `setupNav()` em `js/api.js`, usado por todas as páginas | Mostra/esconde `.auth-only` vs. `.guest-only`, exibe `nav-username` |
| Acesso a funcionalidades protegidas | `pages/jogo.html` (`abrirModal`), `pages/perfil.html`, `pages/admin.html` | Redirecionam para `login.html?next=...` se `isLoggedIn()` for falso, **antes** de chamar a API |
| Logout | `logout()` em `js/api.js` | Limpa `token` + `user` do `localStorage` e redireciona para `login.html` |
| Reflexo do estado de autenticação | `isLoggedIn()` checa token **e** usuário salvos | Página de perfil/admin redireciona sozinha se a sessão expirar (401 vindo da API também dispara a limpeza) |

**Importante para a apresentação:** os redirecionamentos client-side
(`if (!isLoggedIn()) window.location.href = '/pages/login.html'`) são só
**experiência do usuário** — a segurança de verdade está nos middlewares do
back-end (`authenticate`/`authorize`/`requireOwnerOrAdmin`). Um usuário
poderia editar o HTML/JS no DevTools e "esconder" esse redirecionamento,
mas ainda assim receberia 401/403 da API ao tentar a ação protegida — os
dois mostram bem a diferença entre "esconder um botão" e "proteger um
recurso".

## Roteiro de demonstração

1. `cd backend/gamerate-api && npm install && cp .env.example .env && npm run db:setup && npm run dev`.
2. Abrir `http://localhost:3000`, cadastrar uma conta nova pela UI, confirmar
   redirecionamento automático para a home já autenticado.
3. Abrir `npx prisma studio`, localizar o usuário recém-criado e mostrar que
   `senha` é um hash Argon2id, nunca a senha digitada.
4. Deslogar, tentar acessar `/pages/perfil.html` diretamente pela URL →
   redireciona para login (proteção client-side).
5. Abrir `request.http`, rodar a seção AUTH de cima para baixo, depois a
   seção ROTAS PROTEGIDAS — mostrando 401 sem token, 403 com perfil errado,
   200/201 com o token correto.
6. Logar como `admin@gamerate.com` / `admin123` (seed) e abrir
   `/pages/admin.html`; mostrar que a mesma tentativa de acesso com um token
   de usuário comum (via `request.http`, `GET /usuarios`) retorna 403.
7. Rodar `npm run typecheck` para confirmar que o projeto compila sem erros
   de tipo introduzidos pela camada de autenticação.
