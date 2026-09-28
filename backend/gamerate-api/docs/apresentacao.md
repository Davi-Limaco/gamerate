# Apresentação — GameRate

## Checklist dos critérios

| Critério | Status e localização | Demonstração |
|---|---|---|
| Modelagem Prisma | [x] `prisma/schema.prisma` | Abrir o arquivo e explicar os nove models. |
| PK | [x] IDs autoincrementais e PKs compostas no schema | Mostrar `@id`, `@default(autoincrement())` e `@@id`. |
| FK | [x] Relações Prisma e campos `*_fk` | Seguir `Usuario.perfil`, `Avaliacao.usuario/jogo` e tabelas de junção. |
| Relacionamentos | [x] 1:N e N:N no schema | Apontar `Perfil-Usuario`, `Usuario/Jogo-Avaliacao` e as duas junções. |
| ERD | [x] `docs/erd.md` | Comparar nomes/cardinalidades com o schema Prisma. |
| MVC | [x] `src/routes`, `src/controllers`, `src/models` | Acompanhar uma requisição até o Model. |
| Models | [x] `src/models/*.model.ts` | Mostrar consultas e mutations via `prisma.<model>`. |
| Controllers | [x] `src/controllers/*.controller.ts` | Mostrar validação, chamada do Model e status HTTP. |
| Routes | [x] `src/routes/*.routes.ts` | Mostrar endpoints e middleware Zod. |
| Prisma Client | [x] `src/database/prisma.ts` | Mostrar singleton e imports pelos Models. |
| CREATE | [x] `Jogo.create`, `Avaliacao.create`, `Usuario.create` | Criar um jogo no painel ou pelo `request.http`. |
| READ | [x] `findMany`/`findUnique` nos Models | Listar jogos e consultar um ID pela API. |
| UPDATE | [x] `Jogo.update`, `Avaliacao.update`, `Usuario.update` | Editar um jogo ou uma avaliação própria. |
| DELETE | [x] `remove` nos Models principais | Excluir um registro sem referências dependentes. |
| Migration | [x] `prisma/migrations/` | Mostrar `migrate status`; em base nova, `migrate deploy`. |
| Seed | [x] `prisma/seed.ts` | Executar `npm run db:seed` duas vezes; conferir dez avaliadores e ao menos dez avaliações por jogo. |
| SQLite | [x] `DATABASE_URL` em `.env` | Consultar dados via API e conferir no Prisma Studio. |
| `.env` | [x] `backend/gamerate-api/.env` ignorado pelo Git | Explicar que contém configuração local e não é commitado. |
| `.env.example` | [x] `backend/gamerate-api/.env.example` | Mostrar a URL SQLite sem credenciais. |
| `requests.http` | [x] `backend/gamerate-api/request.http` | Executar requisições usando REST Client no VS Code. |
| Teste de criação | [x] Casos válidos e inválidos no arquivo HTTP | Executar CREATE válido e payload inválido. |
| Teste de consulta | [x] Listagem, detalhe e ID inexistente | Mostrar 200 e 404. |
| Teste de atualização | [x] PUT válido, ID ausente e corpo inválido | Mostrar atualização, 404 e 400. |
| Teste de remoção | [x] DELETE válido e ID inexistente | Mostrar 204 e 404. |
| Testes inválidos | [x] Schemas Zod e casos no `request.http` | Enviar nota acima de 5, e-mail inválido ou ID não numérico. |
| CRUD no front-end | [x] `public/pages/admin.html`, `jogo.html`, `avaliacao.html`, `perfil.html` | Criar/editar/excluir jogo; criar/editar/excluir avaliação; cadastrar e editar perfil. |
| TypeScript | [x] `src`, `prisma/seed.ts`, `tsconfig.json` | Executar `npm run typecheck`. |
| Tratamento de erros | [x] `src/errors`, `src/middlewares/errorHandlers.ts` | Mostrar 400, 404, 409 e erro inesperado 500. |
| Responsividade | [x] `frontend/css/shared.css` e CSS responsivo das páginas | Redimensionar para largura móvel e conferir tabelas, modais e formulários. |
| README | [x] `README.md` | Mostrar instalação, banco, comandos e arquitetura. |
| Organização do código | [x] Pastas MVC e camada Prisma | Mostrar separação entre rota, controller, model e persistência. |

## Roteiro de demonstração

1. `cd backend/gamerate-api`, `npm install`, copiar `.env.example` para `.env` e executar `npm run db:setup`.
2. Iniciar com `npm run dev` e abrir `http://localhost:3000`.
3. Executar CREATE, READ, UPDATE e DELETE de jogos em `request.http`, incluindo um caso inválido.
4. Abrir `npx prisma studio` e localizar o jogo e suas linhas nas relações `jogo_genero` e `jogo_plataforma`.
5. Mostrar o schema, o ERD e explicar como controllers chamam os models Prisma.
6. Executar `npm run db:seed` novamente e comprovar que os registros do catálogo não duplicam.

O SQLite local já existente foi preservado. A migration inicial foi marcada como baseline nessa base; uma migration seguinte converte as datas legadas de `YYYY-MM-DD` para ISO-8601, formato lido corretamente por `DateTime` no Prisma.

## Perguntas e respostas

1. **O que é Prisma?** ORM usado nesta API para descrever modelos e consultar o SQLite com TypeScript, sem escrever SQL nas operações dos Models.
2. **O que é um ORM?** Uma camada que representa tabelas como modelos/objetos e converte operações da aplicação em comandos do banco.
3. **Por que SQLite?** É um banco relacional em arquivo, leve para desenvolvimento local e suficiente para o porte acadêmico do GameRate.
4. **O que significa MVC?** Separar acesso a dados (Model), lógica e resposta HTTP (Controller) e definição de endpoints (Route).
5. **Qual a responsabilidade do Model?** Encapsular operações de persistência; por exemplo, `jogo.model.ts` usa `prisma.jogo.findMany`, `create`, `update` e `delete`.
6. **Qual a responsabilidade do Controller?** Receber a requisição validada, chamar o Model e definir status/corpo da resposta.
7. **Qual a responsabilidade da Route?** Declarar métodos/caminhos e associar validação Zod e Controller.
8. **O que é CRUD?** Create, Read, Update e Delete; as rotas `/api/jogos` oferecem POST, GET, PUT e DELETE.
9. **O que é uma PK?** Chave que identifica unicamente uma linha; por exemplo `id_jogo`.
10. **O que é uma FK?** Campo que referencia outra tabela; `Avaliacao.id_jogo_fk` aponta para `Jogo.id_jogo`.
11. **Quais cardinalidades aparecem?** Perfil-usuário, usuário-avaliação e jogo-avaliação são 1:N; jogo-gênero e jogo-plataforma são N:N por tabelas de junção.
12. **O que é uma migration?** Uma alteração versionada do schema. `migrate deploy` aplica migrations existentes sem recriar tabelas.
13. **O que o seed faz?** Insere perfis, admin e catálogo inicial; usa `upsert` para poder ser repetido.
14. **O que é Prisma Client?** Cliente gerado a partir de `schema.prisma`, com tipos e métodos como `findMany`, `findUnique`, `create`, `update` e `delete`.
15. **O que é uma REST API?** Interface HTTP baseada em recursos, métodos e respostas; o front-end chama `/api/jogos` e `/api/avaliacoes`.
16. **Quando usar 400, 404 e 409?** 400 para entrada inválida, 404 para ID inexistente e 409 para conflito como e-mail duplicado ou avaliação duplicada.
17. **Como TypeScript ajuda?** Detecta incompatibilidades em parâmetros, entradas Prisma e respostas antes da execução; `npm run typecheck` verifica o backend.
18. **Por que usar `.env`?** Para configurar URL do banco, porta e SMTP sem fixar valores locais no código; `.env` fica fora do Git e `.env.example` é seguro para compartilhar.
19. **Como o front-end chega ao banco?** `fetch` chama Express; Route valida, Controller encaminha ao Model, Prisma Client persiste no SQLite e a resposta volta em JSON.
20. **Por que há uma migration de normalização de datas?** A base antiga gravava `DATE` como `YYYY-MM-DD`, formato não aceito pelo parser `DateTime` do Prisma; a migration preserva o dia e o converte para ISO-8601.
