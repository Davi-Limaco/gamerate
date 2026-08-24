# Autenticacao do GameRate

## Fluxo

1. `POST /api/auth/cadastro` cria um usuario comum e armazena a senha como hash Argon2id.
2. `POST /api/auth/login` consulta o e-mail, compara a senha com o hash e retorna um JWT.
3. O frontend salva o token em `localStorage` e envia `Authorization: Bearer <token>` nas requisicoes da API.
4. `isAuthenticated` valida assinatura, algoritmo, usuario e expiracao do JWT e define `req.userId`.
5. Rotas protegidas usam o middleware `isAuthenticated`.
6. Logout remove o token do `localStorage`.

## Seguranca

- O segredo JWT vem de `JWT_SECRET`.
- O banco armazena somente hashes Argon2id com salt aleatorio.
- O campo `email` e unico no schema Prisma.
- O middleware identifica o usuario autenticado por `req.userId`.
- O autor de uma avaliacao e obtido de `req.userId`, nunca do corpo enviado pelo cliente.

## Teste com REST Client

No [request.http](../request.http), execute o request nomeado `login`. A variavel `token` captura o JWT retornado. Em seguida, compare:

- `GET /usuarios/me` sem Authorization: esperado `401`.
- `GET /usuarios/me` com `Authorization: Bearer {{token}}`: esperado `200`.
- O mesmo request com `{{invalidToken}}`: esperado `401`.

## Execucao

```bash
cp .env.example .env
npm install
npm run db:load
npm run dev
```

O servidor inicia em `http://localhost:3000`. Use Node.js 23.4.0 ou superior por causa de `crypto.argon2Sync`.
