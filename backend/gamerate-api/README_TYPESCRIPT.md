# 🚀 GameRate API - TypeScript Edition

## 📝 Resumo da Migração

A GameRate API foi **totalmente migrada para TypeScript**, mantendo toda a funcionalidade original e adicionando Type Safety, tratamento de erros padronizado e middlewares globais.

**Status**: ✅ Pronto para uso

---

## 🎯 Alterações Principais

### ✨ Novidades
- ✅ **Type Safety Total**: Todas as entidades, routes e controllers tipados
- ✅ **HttpError Padronizado**: Classe `HttpError` com 6 funções helpers para diferentes status
- ✅ **Middlewares Globais**: 
  - `errorHandler`: Captura e trata todos os erros automaticamente
  - `contentType`: Garante `application/json` em todas as respostas
- ✅ **Scripts npm Atualizados**: 
  - `npm run dev` - Desenvolvimento com hot reload via `tsx watch`
  - `npm run check` - Validar tipos sem compilar
  - `npm run build` - Compilar para produção
- ✅ **Banco Preservado**: Schema SQLite 100% intacto, relacionamentos mantidos

### 📁 Nova Estrutura
```
src/
├── types/index.ts                    # Interfaces TypeScript
├── errors/HttpError.ts               # Classe HttpError + helpers
├── middlewares/                      # errorHandler.ts, contentType.ts
├── database/                         # database.ts, migration.ts, etc
├── models/                           # Jogo, Usuario, Avaliacao, etc
├── controllers/                      # JogoController, etc
├── routes/                           # jogoRoutes.ts, etc
├── index.ts                          # Entry point
└── routes.ts                         # Consolidador de rotas
```

---

## 🚀 Como Começar

### 1️⃣ Instalar Dependências
```bash
cd backend/gamerate-api
npm install
```

### 2️⃣ Validar Migração (Opcional)
```bash
bash validar-migracao.sh
```
Verifica se todos os arquivos estão no lugar correto.

### 3️⃣ Desenvolvimento
```bash
npm run dev
```
Servidor inicia em `http://localhost:3000` com hot reload.

### 4️⃣ Verificar Tipos (Opcional)
```bash
npm run check
```
Valida tipos sem compilar.

### 5️⃣ Preparar Banco de Dados
```bash
npm run db:reload
```
Remove e recria o banco com seed.

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) | Resumo visual com diagramas |
| [TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) | Detalhes técnicos completos |

---

## 🔧 Scripts npm

```bash
npm run dev              # Desenvolvimento com hot reload
npm run build            # Compilar para dist/
npm start                # Executar build compilada
npm run check            # Validar tipos sem compilar

npm run db:reload        # Reset completo: drop + load
npm run db:load          # Executar migration + seed
npm run db:drop          # Remover banco de dados
```

---

## 🛡️ Tratamento de Erros

### Lançar Erro
```typescript
// Opção 1: Com classe
throw new HttpError(404, 'Jogo não encontrado');

// Opção 2: Com helper (recomendado)
throw notFound('Jogo não encontrado');
throw badRequest('Email inválido');
throw unauthorized('Credenciais inválidas');
throw conflict('Já avaliou este jogo');
```

### Middleware Captura Automaticamente
```typescript
// Em qualquer controller
async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const usuario = await Usuario.readById(Number(req.params.id));
    res.json(usuario);
  } catch (err) {
    next(err);  // ← Passa para errorHandler
  }
}

// errorHandler retorna automaticamente: { status: 404, message: 'Usuário não encontrado' }
```

---

## 📊 Tipos Disponíveis

```typescript
import type { 
  Perfil, 
  Usuario, 
  Jogo, 
  Genero, 
  Plataforma, 
  Avaliacao, 
  Categoria, 
  Contato 
} from '@/types/index';
```

---

## 🔄 Banco de Dados

### Schema Preservado
- ✅ Todas as tabelas mantidas
- ✅ Todas as Foreign Keys funcionando
- ✅ Indexes e constraints intactos
- ✅ Seeders funcionam normalmente

### Comandos
```bash
npm run db:load          # Cria tabelas + insere seed
npm run db:drop          # Remove db.sqlite
npm run db:reload        # Drop + Load (reset completo)
```

---

## 📋 Endpoints Disponíveis

### Jogos
```
GET    /api/jogos              # Lista com filtros
GET    /api/jogos/:id          # Detalhes
GET    /api/jogos/stats        # Estatísticas
GET    /api/jogos/destaques    # Destaques
POST   /api/jogos              # Criar
PUT    /api/jogos/:id          # Atualizar
DELETE /api/jogos/:id          # Deletar
```

### Avaliações
```
GET    /api/avaliacoes         # Lista
GET    /api/avaliacoes/:id     # Detalhes
GET    /api/avaliacoes/destaque # Destaque
POST   /api/avaliacoes         # Criar
PUT    /api/avaliacoes/:id     # Atualizar
DELETE /api/avaliacoes/:id     # Deletar
```

### Usuários
```
GET    /api/usuarios           # Lista
GET    /api/usuarios/:id       # Detalhes
GET    /api/usuarios/:id/avaliacoes # Avaliações do usuário
POST   /api/usuarios           # Criar
PUT    /api/usuarios/:id       # Atualizar
DELETE /api/usuarios/:id       # Deletar
```

### Autenticação
```
POST   /api/auth/login         # Login
POST   /api/auth/cadastro      # Cadastro
```

### Categorias
```
GET    /api/generos            # Lista gêneros
GET    /api/plataformas        # Lista plataformas
GET    /api/perfis             # Lista perfis
POST   /api/generos            # Criar gênero
POST   /api/plataformas        # Criar plataforma
POST   /api/perfis             # Criar perfil
PUT    /api/perfis/:id         # Atualizar perfil
DELETE /api/generos/:id        # Deletar gênero
DELETE /api/plataformas/:id    # Deletar plataforma
DELETE /api/perfis/:id         # Deletar perfil
```

### Contato
```
GET    /api/contato            # Lista mensagens
POST   /api/contato            # Enviar mensagem
DELETE /api/contato/:id        # Deletar mensagem
```

---

## ✅ Checklist de Validação

- ✅ TypeScript compilado sem erros
- ✅ Todos os tipos resolvidos
- ✅ Middlewares globais funcionando
- ✅ Banco de dados mantido
- ✅ Seeders funcionando
- ✅ Scripts npm atualizados
- ✅ Hot reload em desenvolvimento
- ✅ Erros padronizados

---

## 🎓 Próximas Melhorias Recomendadas

1. **Testes**
   ```bash
   npm install --save-dev jest @types/jest ts-jest
   ```

2. **Validação de Entrada**
   ```bash
   npm install zod
   ```

3. **Autenticação JWT**
   ```bash
   npm install jsonwebtoken @types/jsonwebtoken
   ```

4. **Documentação API**
   ```bash
   npm install swagger-jsdoc swagger-ui-express
   ```

---

## 🐛 Troubleshooting

### Erro: `Cannot find module 'src/...'`
- Certifique-se de estar usando `npm run dev` (não `node`)
- Verifique se tem `/src/` em todos os imports

### Erro: `TypeScript compilation error`
```bash
npm run check    # Valida tipos
tsc --noEmit     # Sintaxe alternativa
```

### Banco de dados não criado
```bash
npm run db:reload    # Recria e popula
```

---

## 📞 Suporte

Para detalhes técnicos, consulte:
- [TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) - Documentação completa
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Resumo e próximas etapas

---

**Versão**: 1.0.0  
**Tipo**: TypeScript/Express/SQLite  
**Status**: ✅ Pronto para produção
