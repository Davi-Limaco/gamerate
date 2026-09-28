# GameRate

A full-stack web platform for rating and reviewing electronic games, built as an academic project at IFPB (Instituto Federal da Paraíba).

## About

GameRate permite que jogadores descubram jogos, postem avaliações e consultem informações em um único lugar. A aplicação oferece catálogo de jogos, cadastro e login de usuários, gestão de avaliações, e gestão de catálogo de gêneros, plataformas e perfis.

## Features

-  **Home** — Exibição de jogos em destaque, estatísticas e descoberta de títulos
-  **Game Catalog** — Busca e filtragem por gênero e plataforma
-  **Reviews** — Criação, edição e exclusão de avaliações de jogos
-  **Usuários** — Cadastro, login e gerenciamento de perfis de usuário
-  **Contact Form** — Envio de mensagens de contato pelo site
-  **Admin Panel** — Dashboard para gerenciar jogos, usuários, categorias e contatos

## Tech Stack

**Backend**
- Node.js + Express + TypeScript
- Prisma ORM + SQLite
- `zod` para validação de dados (schemas de body/params/query)
- `nodemailer` para envio de e-mail transacional
- `morgan` request logging

**Frontend**
- Vanilla HTML, CSS e JavaScript
- Design responsivo com CSS customizado
- Consumo de API via Fetch

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- VS Code com a extensão REST Client (para os testes HTTP)

### Instalação e configuração

```bash
cd backend/gamerate-api
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

A API ficará disponível em `http://localhost:3000`.
O Express também serve o front-end estático em `public/`; a pasta `frontend/`
mantém a cópia fonte usada no repositório.

Copie `.env.example` para `.env` antes de executar em uma instalação nova.
O `DATABASE_URL` padrão aponta para `src/database/db.sqlite`, relativo a
`prisma/schema.prisma`. O `.env` contém configuração local e não deve ser
versionado.

### 2. Configuração de autenticação (JWT)

A sessão do usuário é mantida por **token JWT** (não por cookie de sessão).
`.env.example` já traz:

```
JWT_SECRET="dev-only-troque-este-valor-em-producao-openssl-rand-hex-32"
JWT_EXPIRES_IN="2h"
```

- `JWT_SECRET` assina e verifica todo token emitido (`src/utils/jwt.ts`). A
  API **não sobe sem essa variável definida** — ver `docs/auth.md` para os
  detalhes de por que isso é intencional. Para produção, gere um valor
  aleatório novo, por exemplo com `openssl rand -hex 32`, e nunca reutilize o
  valor de exemplo do repositório.
- `JWT_EXPIRES_IN` define por quanto tempo cada token continua válido depois
  de emitido (login ou cadastro). Ao expirar, a próxima requisição autenticada
  recebe `401` e o front-end limpa a sessão local automaticamente (ver
  `frontend/js/api.js`).

### 3. Configuração de e-mail (SMTP)

O envio de e-mail (`src/services/SendMail.ts`, usando Nodemailer) é configurado
inteiramente por variáveis de ambiente — veja `.env.example`:

```
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="GameRate <no-reply@gamerate.dev>"
```

- **Com um SMTP real** (seu provedor, Mailtrap, etc.): preencha `SMTP_HOST`,
  `SMTP_USER` e `SMTP_PASS` no `.env` e os e-mails serão enviados de verdade.
- **Sem nada preenchido** (padrão para desenvolvimento): o serviço cria
  automaticamente uma conta de teste na [Ethereal](https://ethereal.email) na
  primeira vez que um e-mail precisa ser enviado, e imprime no terminal a URL
  de prévia da mensagem (`[SendMail] Prévia da mensagem: https://ethereal.email/message/...`).
  Nenhum e-mail real é enviado nesse modo.

O `.env` nunca é versionado (está no `.gitignore`) — apenas o `.env.example`,
sem nenhuma credencial, fica no repositório.

### Banco de dados, migrations e seed

O banco SQLite padrão fica em `backend/gamerate-api/src/database/db.sqlite`.
O schema Prisma está em `backend/gamerate-api/prisma/schema.prisma` e as
migrations versionadas em `backend/gamerate-api/prisma/migrations/`.

Para preparar uma máquina nova (gerar o Client, aplicar migrations e executar
o seed):

```bash
npm run db:setup
```

Comandos individuais:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npm run db:seed
npx prisma studio
```

O seed cria dez contas fictícias de avaliadores e garante pelo menos dez
avaliações por jogo, preenchendo também `nota_media` e `total_avaliacoes`.
As contas de avaliação usam a senha local de demonstração `avaliador123`.
As avaliações são inseridas com `upsert` pela chave composta usuário/jogo;
reexecutar o seed não duplica nem sobrescreve avaliações existentes.

Para aplicar os dados ao banco local, execute `npm run db:seed`.
O seed usa `upsert` e pode ser executado novamente. Para produção/CI e para a
base local que já existia antes do Prisma, use `migrate deploy`; essa base foi
marcada como baseline e preservada. Use `migrate dev` ao desenvolver migrations
em uma base nova/de teste. A base legada possui nomes internos de índices únicos
gerados pelo SQLite; as constraints são semanticamente iguais às do schema,
mas não execute `migrate dev` sobre ela se o comando sugerir reset. Não remova
manualmente o SQLite que contém dados locais.

Se for reaproveitar outra cópia do banco legado (as tabelas já existem, mas
`_prisma_migrations` ainda não), marque apenas a migration inicial como
baseline antes de aplicar a normalização:

```bash
npx prisma migrate resolve --applied 20260926214500_init
npx prisma migrate deploy
```

Não execute o comando de baseline numa base vazia; nela use `npm run db:setup`.

## Project Structure

```
gamerate/
├── backend/
│   └── gamerate-api/
│       ├── docs/                   # ERD, apresentação e documentação de auth
│       ├── prisma/
│       │   ├── migrations/         # Histórico SQL versionado
│       │   ├── schema.prisma       # Entidades, constraints e relações
│       │   └── seed.ts             # Dados iniciais idempotentes
│       ├── public/                 # Front-end servido pelo Express
│       ├── src/
│       │   ├── controllers/        # Handlers HTTP e respostas (auth.controller.ts cuida do login/cadastro)
│       │   ├── database/prisma.ts  # Prisma Client singleton
│       │   ├── errors/             # Erros HTTP e constraints Prisma
│       │   ├── middlewares/        # Validação, auth (JWT), autorização por perfil e tratamento de erros
│       │   ├── models/             # Acesso a dados via Prisma Client
│       │   ├── routes/             # Endpoints e validação
│       │   ├── schemas/            # Schemas Zod
│       │   ├── utils/password.ts   # Hash/verificação de senha (Argon2id)
│       │   ├── utils/jwt.ts        # Emissão/verificação de token JWT
│       │   └── index.ts            # Inicialização Express
│       ├── request.http            # Testes da API (REST Client)
│       └── package.json
└── frontend/
    ├── assets/
    ├── css/
    │   └── shared.css              # Design system global
    ├── js/
    │   └── api.js                  # Cliente HTTP + utilitários
    ├── pages/
    │   ├── admin.html
    │   ├── avaliacao.html
    │   ├── cadastro.html
    │   ├── catalogo.html
    │   ├── contato.html
    │   ├── jogo.html
    │   ├── login.html
    │   └── perfil.html
    └── index.html
```

## Architecture

A arquitetura do backend segue o padrão **Route → Controller → Model → Prisma Client**:

- **Routes** definem os endpoints, aplicam schemas Zod e delegam ao Controller
- **Controllers** usam parâmetros validados, chamam os models e escolhem status HTTP
- **Models** centralizam consultas e mutations tipadas pelo Prisma Client
- **Prisma Client** converte as operações do model em consultas SQLite

```
Request → Route/Validator → Controller → Model → Prisma Client → SQLite → Response
```

### Validação de Dados

Todo endpoint que recebe `body`, `params` ou `query` declara seus schemas
Zod em `src/schemas/*.ts` (campos obrigatórios, tamanho mínimo/máximo,
formato de e-mail, números positivos, etc.) e os aplica na própria rota, via
`validate({ body, params, query })` (`src/middlewares/validate.ts`) — **antes**
do Controller. Isso significa que Controllers e Models não repetem `if`s de
formato/obrigatoriedade: eles já recebem dados validados e com os tipos
corretos (ex.: `id` de rota já vem como `number`).

Quando a validação falha, o middleware repassa um `HttpError(..., 400, issues)`
para o middleware de erros central (`src/middlewares/errorHandlers.ts`), que
responde com:

```json
{ "error": "Dados inválidos na requisição", "issues": [{ "path": "email", "message": "email deve ter um formato válido" }] }
```

**Códigos de erro usados no projeto:**

| Código | Quando acontece | Exemplo |
|---|---|---|
| `400 Bad Request` | O formato dos dados enviados é inválido (schema Zod) | `POST /api/auth/cadastro` com `email` sem `@`, ou `GET /api/jogos/abc` (id não numérico) |
| `404 Not Found` | O formato é válido, mas o recurso não existe no banco | `GET /api/jogos/999999` |
| `401 Unauthorized` | Não há token, o token é inválido/expirado, ou a senha/e-mail não conferem | `GET /api/usuarios` sem header `Authorization`; login com senha errada |
| `403 Forbidden` | O token é válido, mas o usuário não tem permissão para este recurso | Usuário comum tentando listar `/api/usuarios`; editar avaliação de outra pessoa |
| `409 Conflict` | O formato é válido, mas conflita com uma regra/estado do banco | Cadastro com e-mail já existente (`UNIQUE` em `usuario.email`); avaliar o mesmo jogo duas vezes |

### Envio de E-mail

`src/services/SendMail.ts` é a única camada que importa `nodemailer` — routes e
controllers nunca conhecem a biblioteca de e-mail. O gatilho é o cadastro de
usuário: em `auth.controller.ts`, a função `cadastro` primeiro persiste o
usuário (`Usuario.create`); só depois de o `INSERT` ter sucesso é que
`SendMail.enviarEmailBoasVindas(...)` é chamado, dentro de um `.catch()`
próprio — uma falha de SMTP só gera um `console.error`, sem afetar a resposta
201 já decidida. Um cadastro recusado (400 de validação ou 409 de e-mail
duplicado) nunca chega a chamar o serviço de e-mail.

```
POST /auth/cadastro
  └─ validate(cadastroBodySchema)   -> 400 se inválido, para aqui
  └─ Usuario.create(usuario)        -> 409 se e-mail duplicado, para aqui
  └─ res.status(201).json(...)      -> resposta já garantida
  └─ SendMail.enviarEmailBoasVindas -> best-effort, erro só vai pro log
```

Veja `backend/gamerate-api/request.http` para requisições prontas cobrindo
corpo válido/inválido, parâmetro de rota inválido, query inválida e o
cadastro que dispara o e-mail.

### Validação no Front-end

O formulário de cadastro (`frontend/pages/cadastro.html`) usa validação nativa
do HTML (`required`, `minlength`, `type="email"`) e JavaScript
(`setCustomValidity` para checar se "confirmar senha" bate com "senha").
Isso é **retorno imediato ao usuário**, não segurança: qualquer pessoa pode
abrir o DevTools ou usar `curl`/`request.http` para enviar uma requisição
direto à API ignorando o HTML por completo. Por isso as mesmas regras
(obrigatoriedade, formato, tamanho) são repetidas em duas camadas que o
usuário não controla: os schemas Zod na API e as constraints do próprio banco
(`NOT NULL`, `UNIQUE` em `prisma/schema.prisma`, aplicados pelas migrations
Prisma) — a validação do front-end melhora a experiência, a da API/banco
garante a integridade dos dados. Erros retornados pela API (400 com `issues`, ou o 409 de e-mail
duplicado) são exibidos abaixo do campo correspondente, e um `toast()` cobre
o caso de sucesso ou erro genérico.

### Autenticação

Ver `docs/auth.md` para o checklist detalhado por critério de avaliação e o
roteiro de demonstração. Resumo da arquitetura:

- **Senhas**: nunca armazenadas em texto puro. `src/utils/password.ts` gera o
  hash com **Argon2id** (`hashPassword`) no cadastro e em toda atualização de
  senha (`usuario.model.ts`), e compara com `verifyPassword` no login —
  nunca há um "descriptografar" a senha original a partir do hash.
- **Sessão**: um **JWT** (`src/utils/jwt.ts`) assinado com `JWT_SECRET`,
  contendo `{ sub: id_usuario, perfil }` e expiração (`JWT_EXPIRES_IN`).
  Emitido em `POST /auth/login` e `POST /auth/cadastro`, é guardado pelo
  front-end (`localStorage`) e reenviado em todo request subsequente no
  header `Authorization: Bearer <token>`.
- **Middleware de autenticação** (`src/middlewares/authenticate.ts`): lê e
  valida esse header, preenchendo `req.usuario = { id, perfil }` para os
  handlers seguintes; sem token válido, responde `401` antes de a rota
  protegida ser alcançada.
- **Middlewares de autorização**: `authorize(...perfis)`
  (`src/middlewares/authorize.ts`) restringe uma rota inteira a perfis
  específicos (ex.: `authorize('Administrador')`); `requireOwnerOrAdmin`
  e `requireAvaliacaoOwnerOrAdmin` restringem uma rota a "o dono do recurso
  ou um Administrador" — usados em `/usuarios/:id` e `/avaliacoes/:id`.
- **Rota protegida de exemplo**: `GET /auth/me` só responde com um token
  válido; usada pelo front-end para restaurar a sessão salva.

```
Route → authenticate (401 se sem token) → authorize/requireOwnerOrAdmin (403 se sem permissão) → Controller
```

Veja `backend/gamerate-api/request.http` (seções "AUTH" e "ROTAS
PROTEGIDAS") para o fluxo completo testado via REST Client: cadastro válido
e inválido, login válido e com credenciais erradas, acesso negado sem token,
acesso negado com token de outro perfil, e acesso liberado com o token
correto — incluindo o token de uma resposta sendo reaproveitado no header
`Authorization` de requisições seguintes.

### Models Overview

| Model | Responsibilities |
|---|---|
| `jogo.model.ts` | Consultas, filtros, detalhes, estatísticas e CRUD de jogos |
| `avaliacao.model.ts` | CRUD de avaliações, unicidade por usuário/jogo e atualização da média |
| `usuario.model.ts` | Cadastro (com hash Argon2id), consulta e atualização de usuários |
| `genero.model.ts` / `plataforma.model.ts` | Classificações e plataformas do catálogo |
| `perfil.model.ts` / `contato.model.ts` | Perfis de usuário e mensagens de contato |

### Modelagem Prisma e cardinalidades

No SQLite, `Int` usa `INTEGER`, `String` usa `TEXT`, `Float` usa `REAL` e
`DateTime` usa `DATETIME`. Campos são obrigatórios por padrão; `?` representa
coluna anulável.

| Entidade | Atributos (`tipo`, nulidade/default) e chaves |
|---|---|
| `Perfil` | `id_perfil Int` PK autoincrement; `nome_perfil String` NOT NULL UNIQUE |
| `Usuario` | `id_usuario Int` PK autoincrement; `nome_usuario String`, `email String` UNIQUE, `senha String`, `id_perfil_fk Int` FK NOT NULL; `data_criacao DateTime` NOT NULL DEFAULT CURRENT_DATE |
| `Jogo` | `id_jogo Int` PK autoincrement; `nome_jogo String`, `desenvolvedora String`, `data_lancamento DateTime`, `descricao String` NOT NULL; `nota_media Float?`, `capa String?`; `total_avaliacoes Int` NOT NULL DEFAULT 0 |
| `Plataforma` | `id_plataforma Int` PK autoincrement; `nome_plataforma String` NOT NULL UNIQUE |
| `JogoPlataforma` | `id_jogo_fk Int` FK e `id_plataforma_fk Int` FK; ambos formam PK composta |
| `Genero` | `id_genero Int` PK autoincrement; `nome_genero String` NOT NULL UNIQUE |
| `JogoGenero` | `id_jogo_fk Int` FK e `id_genero_fk Int` FK; ambos formam PK composta |
| `Avaliacao` | `id_avaliacao Int` PK autoincrement; `id_usuario_fk Int` FK, `id_jogo_fk Int` FK, `nota Float`, `titulo String`, `texto String` NOT NULL; `data_publicacao DateTime` NOT NULL DEFAULT CURRENT_DATE; UNIQUE (`id_usuario_fk`, `id_jogo_fk`) |
| `ComunicacaoSite` | `id_comunicacao Int` PK autoincrement; `email_contato String`, `tipo String`, `mensagem String` NOT NULL; `data_comunicacao DateTime` NOT NULL DEFAULT CURRENT_DATE |

Relacionamentos: `Perfil 1:N Usuario`; `Usuario 1:N Avaliacao`;
`Jogo 1:N Avaliacao`; `Jogo N:N Genero` por `JogoGenero`; e
`Jogo N:N Plataforma` por `JogoPlataforma`. Cada registro de junção tem
exatamente um jogo e uma classificação/plataforma; cada lado pode ter zero ou
muitos registros associados. `ComunicacaoSite` não tem FK.

O ERD de [docs/erd.md](backend/gamerate-api/docs/erd.md) foi escrito a partir
dos nomes, tipos e relações de `prisma/schema.prisma`.

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/cadastro` | Registrar novo usuário |
| POST | `/api/auth/login` | Autenticar usuário |
| GET | `/api/jogos` | Listar jogos (filtros por `search`, `genero`, `plataforma`) |
| GET | `/api/jogos/stats` | Estatísticas do catálogo |
| GET | `/api/jogos/destaques` | Jogos em destaque |
| GET | `/api/jogos/:id` | Detalhes de um jogo |
| POST | `/api/jogos` | Criar jogo |
| PUT | `/api/jogos/:id` | Editar jogo |
| DELETE | `/api/jogos/:id` | Excluir jogo |
| GET | `/api/avaliacoes` | Listar avaliações |
| GET | `/api/avaliacoes/destaque` | Avaliações em destaque |
| GET | `/api/avaliacoes/:id` | Detalhe de avaliação |
| POST | `/api/avaliacoes` | Criar avaliação |
| PUT | `/api/avaliacoes/:id` | Atualizar avaliação |
| DELETE | `/api/avaliacoes/:id` | Excluir avaliação |
| GET | `/api/usuarios` | Listar usuários |
| GET | `/api/usuarios/:id` | Obter usuário por id |
| GET | `/api/usuarios/:id/avaliacoes` | Avaliações de um usuário |
| POST | `/api/usuarios` | Criar usuário |
| PUT | `/api/usuarios/:id` | Atualizar usuário |
| PUT | `/api/usuarios/:id/perfil` | Alterar perfil do usuário |
| DELETE | `/api/usuarios/:id` | Excluir usuário |
| GET | `/api/generos` | Listar gêneros |
| POST | `/api/generos` | Criar gênero |
| DELETE | `/api/generos/:id` | Excluir gênero |
| GET | `/api/plataformas` | Listar plataformas |
| POST | `/api/plataformas` | Criar plataforma |
| DELETE | `/api/plataformas/:id` | Excluir plataforma |
| GET | `/api/perfis` | Listar perfis |
| POST | `/api/perfis` | Criar perfil |
| PUT | `/api/perfis/:id` | Atualizar perfil |
| DELETE | `/api/perfis/:id` | Excluir perfil |
| GET | `/api/contato` | Listar contatos |
| POST | `/api/contato` | Enviar mensagem de contato |
| DELETE | `/api/contato/:id` | Excluir mensagem de contato |

## Testes da API

Com a API iniciada, abra `backend/gamerate-api/request.http` no VS Code com a
extensão REST Client. Execute as requisições de CREATE, READ, UPDATE e DELETE
em ordem; os cenários marcados como inválidos ou inexistentes demonstram os
status 400, 404 e 409. Os IDs indicados podem ser adaptados aos registros que
o aluno criar durante o teste.

Para demonstrar a integração com SQLite, execute um `POST /api/jogos`, consulte
o jogo com `GET /api/jogos/:id`, edite-o com `PUT`, e abra `npx prisma studio`
para conferir o registro nas tabelas `jogo`, `jogo_genero` e
`jogo_plataforma`. A exclusão só é permitida quando o jogo não possui avaliações.

O CRUD pelo navegador está disponível em `http://localhost:3000`: cadastro de
usuário em `/pages/cadastro.html`, envio/edição/exclusão da própria avaliação
na página de jogo/avaliação, edição de conta em `/pages/perfil.html`, e
criação/edição/exclusão de jogos e moderação de usuários/avaliações no painel
administrativo.

O checklist de critérios, roteiro de demonstração e perguntas para a defesa
estão em [docs/apresentacao.md](backend/gamerate-api/docs/apresentacao.md).

## Default Admin

Após rodar os seeds:
- **Email:** admin@gamerate.com
- **Password:** admin123

> Altere a senha após o primeiro login.

## Team

- Arthur Vinícius França Silva
- Davi Lima de Carvalho Oliveira

IFPB — Instituto Federal de Educação, Ciência e Tecnologia da Paraíba
