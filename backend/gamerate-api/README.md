# GameRate API

API em Node.js + Express + TypeScript para o projeto GameRate, com validação de dados via Zod, autenticação JWT, Prisma e envio de e-mail via Nodemailer.

## Requisitos

- Node.js 23+
- npm
- SQLite via Prisma

## Instalação

1. Acesse a pasta do backend:

```bash
cd backend/gamerate-api
```

2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

4. Ajuste as variáveis do arquivo `.env` com suas credenciais locais ou de teste.

## Configuração do SMTP

O projeto usa variáveis de ambiente para configurar o envio de e-mail. Exemplo no `.env.example`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="substitua-por-um-segredo-longo-e-aleatorio"

MAIL_HOST="smtp.mailtrap.io"
MAIL_PORT="2525"
MAIL_SECURE="false"
MAIL_USER="seu_usuario_mailtrap"
MAIL_PASS="sua_senha_mailtrap"
MAIL_FROM="no-reply@gamerate.local"
MAIL_TO="admin@gamerate.com"
```

### Recomendação

Use o Mailtrap para desenvolvimento. Ele permite testar o envio de e-mails sem expor credenciais reais.

> As credenciais SMTP não devem permanecer no repositório. Mantenha apenas no `.env` local.

## Banco de dados

Gere o Prisma e execute o banco:

```bash
npx prisma generate
npx prisma migrate dev
```

Se quiser popular o banco com dados iniciais:

```bash
npm run db:seed
```

## Executando a API

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000/api
```

## Testes via REST Client

O projeto inclui o arquivo `request.http` para testes com a extensão REST Client do VSCode.

Abra o arquivo `request.http` e use o botão "Send Request" para testar os cenários abaixo.

### Cenários principais

#### 1. Cadastro válido

```http
POST http://localhost:3000/api/auth/cadastro
Content-Type: application/json

{
  "nome_usuario": "Teste",
  "email": "teste@teste.com",
  "senha": "senha123"
}
```

Resultado esperado:
- HTTP 201
- cadastro realizado
- e-mail de boas-vindas disparado, se SMTP estiver configurado

#### 2. E-mail duplicado

```http
POST http://localhost:3000/api/auth/cadastro
Content-Type: application/json

{
  "nome_usuario": "Admin Duplicado",
  "email": "admin@gamerate.com",
  "senha": "senha123"
}
```

Resultado esperado:
- HTTP 409
- mensagem: "E-mail já cadastrado"

#### 3. Dados inválidos

```http
POST http://localhost:3000/api/auth/cadastro
Content-Type: application/json

{
  "nome_usuario": "A",
  "email": "email-invalido",
  "senha": "123"
}
```

Resultado esperado:
- HTTP 400
- `details` com os erros do Zod

#### 4. Recurso inexistente

```http
GET http://localhost:3000/api/jogos/99999
```

Resultado esperado:
- HTTP 404

#### 5. Envio de contato

```http
POST http://localhost:3000/api/contato
Content-Type: application/json

{
  "email_contato": "usuario@email.com",
  "tipo": "Dúvida",
  "mensagem": "Gostaria de saber como funciona o sistema de avaliações do GameRate."
}
```

Resultado esperado:
- HTTP 201
- mensagem salva no banco
- e-mail enviado, se SMTP estiver configurado

## Comportamento do e-mail

### Fluxo de cadastro

- o cadastro cria o usuário
- depois disso, o sistema tenta disparar um e-mail de boas-vindas
- se o SMTP falhar, o cadastro continua e o erro é registrado no terminal
- a aplicação não derruba a requisição por causa do problema no envio de e-mail

### Fluxo de contato

- o contato é salvo no banco
- o sistema envia uma mensagem ao administrador
- a mensagem também pode sair em texto puro e HTML

## Validação de dados

A validação fica centralizada com Zod e middleware genérico em:

- `src/schemas/index.ts`
- `src/middlewares/validate.ts`

Isso garante que os controllers e models não tenham validações repetidas em `if` para cada campo da requisição.

## Tratamento de erros

O projeto usa tratamento centralizado de erros em:

- `src/middlewares/errorHandlers.ts`
- `src/errors/HttpError.ts`

Regra geral:
- 400: dados inválidos
- 404: recurso não encontrado
- 409: conflito de regra de negócio

## Verificação final

Para validar que o backend continua compilando:

```bash
npm run typecheck
```

Se o comando finalizar sem erro, a base do projeto está estável.

## Observações

- O front-end deve usar a API em `/api` e o módulo `public/js/api.js` para chamadas e feedback ao usuário.
- A validação do front-end serve para UX, mas a validação real e segura fica na API.
- O banco e as credenciais SMTP devem ser mantidos localmente e não versionados em repositório público.
