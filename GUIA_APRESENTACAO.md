# 📢 Guia de Apresentação - GameRate

Preparação estratégica para apresentar o projeto GameRate aos avaliadores.

---

## 📋 Antes da Apresentação

### ✅ Checklist de Preparação

- [ ] Testar API completa (npm run dev)
- [ ] Rodar seeds do banco (npm run db:reload)
- [ ] Verificar se todos os requests.http funcionam
- [ ] Abrir site no navegador (localhost:3000)
- [ ] Fazer login com admin@gamerate.com / admin123
- [ ] Testar todos os filtros do catálogo
- [ ] Criar/deletar avaliação como teste
- [ ] Acessar painel admin
- [ ] Verificar responsividade em mobile
- [ ] Preparar 3-5 destaques de funcionalidades

### 🔧 Setup Final (15 min antes)

```bash
# Terminal 1: Backend rodando
cd backend/gamerate-api
npm install  # se necessário
npm run db:reload  # reseta banco com dados
npm run dev  # inicia servidor em porta 3000

# Terminal 2: Browser aberto
# http://localhost:3000
```

---

## 🎯 Estrutura da Apresentação (15-20 minutos)

### 1️⃣ Introdução (2 min)

**Fala sugerida:**

> "GameRate é uma plataforma full-stack para avaliação e descoberta de jogos eletrônicos. O projeto integra Node.js/Express no backend com Prisma ORM, SQLite como banco de dados, e uma interface responsiva em vanilla HTML/CSS/JavaScript no frontend. A aplicação demonstra os conceitos de modelagem de banco de dados, arquitetura MVC, operações CRUD, e integração completa entre camadas."

**Slide visual:**
- Logo/screenshot do projeto
- Stack: Node.js + Prisma + SQLite + Vanilla JS

---

### 2️⃣ Modelagem do Banco de Dados (3 min)

**Pontos a cobrir:**

1. **Schema Prisma bem estruturado**
   ```
   Abrir: prisma/schema.prisma
   Mostrar: 
   - Modelo Usuário com Perfil (relacionamento 1:N)
   - Modelo Avaliação (1:N com Usuario e Jogo)
   - Modelos Jogo, Genero, Plataforma
   - Tabelas de junção JogoGenero, JogoPlataforma (N:N)
   ```

2. **Diagrama ERD**
   ```
   Abrir: docs/erd.md
   Apontar:
   - 8 entidades
   - Relacionamentos 1:N
   - Relacionamentos N:N via tabelas de junção
   - Constraints (PK, FK, UK)
   ```

3. **Explicar decisões de design**
   - "Usei Perfil para controlar tipos de usuário"
   - "Tabelas de junção para suportar N:N"
   - "Timestamps para auditoria"

---

### 3️⃣ Arquitetura MVC (3 min)

**Diagrama de fluxo:**

```
Usuário (Browser)
    ↓
Frontend (HTML/CSS/JS) ← api.js
    ↓
Express.js Routes (src/routes/)
    ↓
Controllers (src/controllers/) - Tratam requisição
    ↓
Models (src/models/) - Lógica de negócio
    ↓
Prisma Client
    ↓
SQLite Database
```

**Demonstrar no código:**

1. **Rota:** `src/routes/jogos.routes.ts`
   ```typescript
   router.get('/jogos', JogosController.read);
   router.post('/jogos', validate(...), JogosController.create);
   ```

2. **Controller:** `src/controllers/jogos.controller.ts`
   ```typescript
   async function read(req: Request, res: Response) {
     const { search, genero, plataforma } = req.query;
     const jogos = await Jogo.readAll({ search, genero, plataforma });
     res.json({ total: jogos.length, jogos });
   }
   ```

3. **Model:** `src/models/jogo.model.ts`
   ```typescript
   async function readAll(filter?: JogoFilter): Promise<JogoResumo[]> {
     const where: any = {};
     if (filter?.search) where.nome_jogo = { contains: filter.search };
     // ... outros filtros
     const rows = await prisma.jogo.findMany({ where });
     return rows.map(...);
   }
   ```

**Pontuar:** "Vejo que cada camada tem responsabilidade bem definida"

---

### 4️⃣ Operações CRUD (3 min)

**Demonstrar na API:**

Abrir arquivo: `request.http` no VS Code com REST Client

**Sequência de testes:**

1. **CREATE - Listar jogos**
   ```http
   GET http://localhost:3000/api/jogos
   ```
   → Mostra 6 jogos do seed

2. **READ - Buscar um jogo**
   ```http
   GET http://localhost:3000/api/jogos/1
   ```
   → Mostra Elden Ring com generos e plataformas

3. **CREATE - Novo jogo (criar)**
   ```http
   POST http://localhost:3000/api/jogos
   {
     "nome_jogo": "Hades",
     "desenvolvedora": "Supergiant Games",
     ...
   }
   ```
   → Retorna jogo criado com sucesso (201)

4. **UPDATE - Atualizar jogo**
   ```http
   PUT http://localhost:3000/api/jogos/9
   {
     "nome_jogo": "Hades - Updated"
   }
   ```
   → Jogo atualizado

5. **DELETE - Deletar jogo**
   ```http
   DELETE http://localhost:3000/api/jogos/9
   ```
   → Deletado com sucesso (204)

6. **Filtros avançados**
   ```http
   GET http://localhost:3000/api/jogos?search=God&genero=Ação
   ```
   → Mostra apenas God of War com filtro

---

### 5️⃣ Migrations e Seed (2 min)

**Mostrar arquivos:**

1. **Migration automática**
   ```
   prisma/migrations/20260628202148_init/migration.sql
   ```
   - "Prisma gera SQL automaticamente"
   - Mostra: CREATE TABLE perfil, usuario, jogo...
   - Mostra: FOREIGN KEY constraints

2. **Seed estruturado**
   ```
   src/database/seeders.json
   ```
   - Dados de exemplo realistas
   - 3 perfis, 1 admin, 10 plataformas, 6 jogos

3. **Scripts NPM**
   ```bash
   npm run db:reload    # Drop + migrate + seed
   npm run db:studio    # Interface visual do Prisma
   ```

**Fala:** "O banco é recriável e testável em qualquer máquina"

---

### 6️⃣ Testes da API (2 min)

**Mostrar arquivo:** `request.http`

- 30+ testes documentados
- Testam todos CRUD operations
- Filtros, busca, estatísticas
- Login e cadastro

**Executar 3-4 testes principais na frente dos avaliadores**

---

### 7️⃣ Interface Frontend (3 min)

**Abrir navegador e demonstrar:**

1. **Home page** (localhost:3000)
   - Destaques de jogos
   - Estatísticas
   - Navegação clara

2. **Catálogo com filtros** (/pages/catalogo.html)
   - Listar todos os jogos
   - Filtrar por gênero (selecionar "RPG")
   - Filtrar por plataforma (selecionar "PC")
   - Buscar por nome
   - Clique em um jogo

3. **Página de jogo** (/pages/jogo.html?id=1)
   - Detalhes completos
   - Gêneros e plataformas
   - Nota média e avaliações
   - Link para avaliações

4. **Login** (/pages/login.html)
   - Email: admin@gamerate.com
   - Senha: admin123
   - Mostrar que redirect para home

5. **Painel Admin** (/pages/admin.html)
   - Dashboard com estatísticas
   - Tabela de jogos
   - Botão "Novo jogo"
   - Gerenciar usuários, avaliações

**Pontuar:** "Interface responsiva, design moderno, fácil de usar"

---

### 8️⃣ Pontos Fortes & Diferenças (2 min)

**Comparar com projeto de referência:**

| Aspecto | GameRate | Investment API |
|---------|----------|-----------------|
| Banco de dados | 8 tabelas com N:N | 3 tabelas simples |
| Autenticação | ✅ Completa | ❌ Não tem |
| Admin panel | ✅ Sim | ❌ Não |
| Páginas | ✅ 8+ páginas | ✅ Múltiplas |
| Relacionamentos | ✅ N:N | ❌ Não |

**Fala:** "GameRate vai além do escopo básico, incluindo autenticação e painel administrativo"

---

## 📊 Respostas Preparadas para Perguntas Esperadas

### P1: "Por que Prisma em vez de SQL direto?"

**R:** "Prisma oferece type-safety com TypeScript, migrations automáticas, e proteção contra SQL Injection. O code-first schema é mais fácil de manter do que SQL manual."

---

### P2: "Como você estruturou os relacionamentos N:N?"

**R:** "Criei tabelas de junção (JogoGenero, JogoPlataforma) com chaves compostas. No Prisma, defino os relacionamentos em ambas as entidades. Isso permite que um jogo tenha múltiplos gêneros e plataformas, e vice-versa."

**Mostrar no schema:**
```prisma
model JogoGenero {
  id_jogo_fk   Int
  id_genero_fk Int
  jogo    Jogo    @relation(fields: [id_jogo_fk], references: [id_jogo])
  genero  Genero  @relation(fields: [id_genero_fk], references: [id_genero])
  @@id([id_jogo_fk, id_genero_fk])
}
```

---

### P3: "Explique o fluxo de uma requisição POST /jogos"

**R:** "Quando um usuário posta um novo jogo:

1. Request chega em `/routes/jogos.routes.ts`
2. Validação de Content-Type no middleware
3. Controller `JogosController.create()` recebe req/res
4. Controller valida e chama `Jogo.create()` no model
5. Model cria registro com `prisma.jogo.create()`, também cria relacionamentos N:N
6. Response retorna jogo criado (201)"

---

### P4: "Como você testou a API?"

**R:** "Usei REST Client do VSCode com arquivo request.http contendo 30+ testes:
- CRUD completo (create, read, update, delete)
- Filtros (busca por nome, gênero, plataforma)
- Autenticação (login, cadastro)
- Operações relacionadas (avaliações, usuários)

Cada teste é documentado e pode ser executado com um clique."

---

### P5: "Qual foi o maior desafio?"

**R:** "Implementar os relacionamentos N:N corretamente, especialmente garantir que ao criar um jogo com múltiplos gêneros e plataformas, todos os registros fossem criados na ordem correta sem violar constraints. Resolvi usando transações e criando os relacionamentos em sequência."

---

### P6: "Como você abordaria a segurança?"

**R:** "Pontos identificados para melhorias:
1. Hashing de senhas com bcrypt (atualmente em texto plano - não fazer em produção)
2. Validação robusta com Zod
3. JWT para sessões
4. CORS configuration
5. Rate limiting

Estou preparado para implementar hash de senhas se solicitado."

---

### P7: "Por que escolheu esse design de banco?"

**R:** "Modelei pensando em um caso de uso real:
- Perfil controla tipos de usuário (jogador, crítico, admin)
- Usuários fazem avaliações de jogos
- Jogos têm múltiplos gêneros e plataformas
- Tabela de contato é independente para formulário público

Isso reflete como uma plataforma real funcionaria."

---

### P8: "Como o banco é recriável?"

**R:** "Com 3 comandos:
```bash
npm run db:drop       # Remove banco
npm run db:load       # Roda migration + seed
# ou npm run db:reload para uma só linha
```

Todas as tabelas são recriadas com dados de exemplo consistentes. Isso facilita testes e desenvolvimento."

---

## 🎥 Demonstração Prática (5 min)

**Script de demonstração ao vivo:**

```
1. Terminal 1: npm run dev
   → Mostrar "listening on port 3000"

2. Navegador:
   → Abrir http://localhost:3000
   → Clicar em "Jogos"
   → Mostrar 6 jogos carregados

3. REST Client:
   → Abrir request.http
   → Executar GET /jogos
   → Mostrar resposta com 6 jogos

4. Criar novo jogo:
   → Executar POST /jogos com Hades
   → Mostrar 201 Created com ID do novo jogo

5. Voltar ao navegador:
   → Recarregar catálogo
   → Mostrar Hades agora listado

6. Filtrar:
   → Selecionar gênero "RPG"
   → Mostrar apenas jogos com RPG

7. Painel admin:
   → Abrir /pages/admin.html
   → Mostrar dashboard com estatísticas
   → Abrir tabela de jogos
   → Mostrar Hades na lista
```

---

## 📝 Respostas a Objeções Comuns

### Objeção: "Faltam validações de entrada"

**Resposta:** "Tem razão. Criei um arquivo MELHORIAS_RECOMENDADAS.md que mostra como implementar validação com Zod em todas as rotas. Posso fazer isso em minutos."

---

### Objeção: "Senhas em texto plano é grave"

**Resposta:** "Completamente certo. Deixei dessa forma apenas para simplicidade no desenvolvimento. Tenho código pronto com bcrypt que posso implementar agora. Vou mostrar o arquivo MELHORIAS_RECOMENDADAS.md."

---

### Objeção: "CRUD do frontend não está completo"

**Resposta:** "Verdade. Listagem (READ) está 100%, delete (DELETE) está em avaliações. Para CREATE/UPDATE, foca não foi tanto no frontend quanto na API robusta. Mas criei uma página completa de edição de jogo (jogo-admin.html) que posso mostrar."

---

### Objeção: "Sem testes automatizados"

**Resposta:** "Documentei todos os testes manualmente no request.http. Seria ótimo adicionar Jest para testes unitários, que está no roadmap de melhorias."

---

## 🏆 O Que Destacar Como Diferenciais

✅ **Relacionamentos N:N complexos** - Não está no projeto de referência

✅ **Autenticação completa** - Investment API não tem

✅ **Admin panel funcional** - Gerenciamento de recursos

✅ **8 entidades vs 3** - Projeto mais ambicioso

✅ **Prisma ORM** - Mais moderno que SQL manual

✅ **ERD visual em Mermaid** - Boa documentação

✅ **30+ testes na API** - Cobertura abrangente

---

## ⏱️ Gestão de Tempo (20 min total)

```
0:00 - 0:02   Introdução
0:02 - 0:05   Banco de dados + ERD
0:05 - 0:08   Arquitetura MVC
0:08 - 0:11   Operações CRUD (REST Client)
0:11 - 0:13   Migrations + Seed
0:13 - 0:15   Testes API
0:15 - 0:18   Interface Frontend
0:18 - 0:20   Pontos fortes + perguntas
```

---

## 💪 Dicas Finais

1. **Fale com confiança** - Você construiu isso, conhece bem
2. **Prepare o ambiente** - Tenha tudo rodando antes
3. **Mostre, não fale** - Execute demos ao vivo
4. **Responda honestamente** - Se não sabe, diga "não consideramos ainda"
5. **Aproveite as melhorias** - Tenha os documentos de recomendação prontos
6. **Pergunte** - "Querem que eu implemente validação com Zod agora?"

---

## 📱 QR Code ou Link para Repositório

Se possível, tenha pronto:
- Link GitHub atualizado
- Deploy online (Vercel, Heroku, Railway)
- Documento ANALISE_AVALIACAO.md aberto como referência

---

## ✅ Último Checklist (5 min antes)

```
Ambiente:
  [ ] Backend rodando (npm run dev)
  [ ] Banco resetado (npm run db:reload)
  [ ] Browser aberto em localhost:3000
  [ ] request.http aberto no VS Code
  [ ] Todos os arquivos salvos

Documentos:
  [ ] ANALISE_AVALIACAO.md (resumo)
  [ ] MELHORIAS_RECOMENDADAS.md (código pronto)
  [ ] COMPARATIVO_INVESTMENT_API.md (diferenças)
  [ ] docs/erd.md (diagrama)

Testes:
  [ ] Home page carrega
  [ ] Catálogo com filtros funciona
  [ ] Login com admin funciona
  [ ] Painel admin abre
  [ ] 3-4 requests HTTP funcionam

Respaldo:
  [ ] Celular como hotspot
  [ ] Prints de demo em USB
  [ ] Código impresso (opcional)
```

---

**Boa apresentação! 🎮**

**Data:** 28/06/2026  
**Status:** Pronto para apresentar
