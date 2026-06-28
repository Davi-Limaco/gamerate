# 🔧 Guia Prático: Implementando as Melhorias Recomendadas

Este documento fornece exemplos de código para implementar as melhorias críticas e importantes identificadas na análise.

---

## 🔴 CRÍTICAS

### 1. Hash de Senhas com Bcrypt

**Problema:** Senhas armazenadas em texto plano

**Solução:**

#### 1.1. Instalar dependência
```bash
cd backend/gamerate-api
npm install bcrypt
npm install -D @types/bcrypt
```

#### 1.2. Atualizar modelo de usuário

**Arquivo:** `src/models/usuario.model.ts`

```typescript
import bcrypt from 'bcrypt';
import { prisma } from '@/database/prisma.ts';

const SALT_ROUNDS = 10;

async function create({ nome_usuario, email, senha, id_perfil_fk = 1 }: UsuarioInput): Promise<Usuario> {
  if (!nome_usuario || !email || !senha) {
    throw new HttpError('Campos obrigatórios: nome_usuario, email, senha');
  }

  // Hash da senha antes de armazenar
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  try {
    const r = await prisma.usuario.create({
      data: {
        nome_usuario,
        email,
        senha: senhaHash,  // ✅ Armazenar hash, não texto plano
        id_perfil_fk,
      },
      include: { perfil: { select: { nome_perfil: true } } },
    });
    
    return {
      id_usuario: r.id_usuario,
      nome_usuario: r.nome_usuario,
      email: r.email,
      senha: undefined,  // ✅ Nunca retornar senha
      id_perfil_fk: r.id_perfil_fk,
      nome_perfil: r.perfil?.nome_perfil,
      data_criacao: dateToString(r.data_criacao),
    };
  } catch (error) {
    throw new HttpError('Email já registrado', 409);
  }
}

async function readByEmail(email: string): Promise<Usuario | undefined> {
  const r = await prisma.usuario.findFirst({
    where: { email },
    include: { perfil: { select: { nome_perfil: true } } },
  });
  
  if (!r) return undefined;
  
  return {
    id_usuario: r.id_usuario,
    nome_usuario: r.nome_usuario,
    email: r.email,
    senha: r.senha,  // Retornar hash apenas para verificação de login
    id_perfil_fk: r.id_perfil_fk,
    nome_perfil: r.perfil?.nome_perfil,
    data_criacao: dateToString(r.data_criacao),
  };
}

export default { readAll, readById, readByEmail, readAvaliacoes, create, update, updatePerfil, remove };
```

#### 1.3. Atualizar controller de autenticação

**Arquivo:** `src/controllers/usuarios.controller.ts`

```typescript
import bcrypt from 'bcrypt';

async function login(req: Request, res: Response) {
  try {
    const { email, senha } = req.body as LoginInput;
    const usuario = await Usuario.readByEmail(email);

    if (!usuario) {
      throw new HttpError('Credenciais inválidas', 401);
    }

    // ✅ Comparar hash em vez de string direta
    const senhaValida = await bcrypt.compare(senha, usuario.senha || '');
    
    if (!senhaValida) {
      throw new HttpError('Credenciais inválidas', 401);
    }

    res.json({
      id: usuario.id_usuario,
      nome: usuario.nome_usuario,
      perfil: usuario.nome_perfil,
    });
  } catch (error) {
    throw new HttpError('Credenciais inválidas', 401);
  }
}

async function cadastro(req: Request, res: Response) {
  try {
    const usuario = req.body as UsuarioInput;
    const created = await Usuario.create(usuario);
    res.status(201).json({
      id: created.id_usuario,
      nome: created.nome_usuario,
      perfil: created.nome_perfil,
    });
  } catch (error) {
    throw new HttpError('Erro ao cadastrar usuário', 400);
  }
}

export default { /* ... */, login, cadastro };
```

#### 1.4. Migração de dados existentes (se houver dados no banco)

```typescript
// script para migrar senhas existentes (executar uma vez)
import bcrypt from 'bcrypt';
import { prisma } from '@/database/prisma.ts';

async function migratePasswords() {
  const usuarios = await prisma.usuario.findMany();
  
  for (const user of usuarios) {
    // Se a senha não parece ser um hash bcrypt
    if (!user.senha.startsWith('$2')) {
      const hashed = await bcrypt.hash(user.senha, 10);
      await prisma.usuario.update({
        where: { id_usuario: user.id_usuario },
        data: { senha: hashed },
      });
      console.log(`✅ Migrado: ${user.nome_usuario}`);
    }
  }
  
  console.log('Migração concluída!');
}

// Executar: npx ts-node src/scripts/migrate-passwords.ts
```

---

### 2. Validação com Zod

**Problema:** Sem validação de entrada, risco de XSS/SQL Injection

**Solução:**

#### 2.1. Instalar Zod
```bash
npm install zod
```

#### 2.2. Criar schemas de validação

**Arquivo:** `src/schemas/index.ts`

```typescript
import { z } from 'zod';

// ========== JOGO ==========
export const JogoCreateSchema = z.object({
  nome_jogo: z.string().min(3, 'Nome deve ter 3+ caracteres').max(255),
  desenvolvedora: z.string().min(2).max(255),
  data_lancamento: z.string().date('Data inválida'),
  descricao: z.string().min(10).max(2000),
  capa: z.string().url('URL inválida').optional().nullable(),
  generos: z.array(z.number().int().positive()).optional().default([]),
  plataformas: z.array(z.number().int().positive()).optional().default([]),
});

export const JogoUpdateSchema = JogoCreateSchema.partial();

// ========== USUÁRIO ==========
export const UsuarioCreateSchema = z.object({
  nome_usuario: z.string().min(3).max(100),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter 6+ caracteres'),
  id_perfil_fk: z.number().int().positive().optional().default(1),
});

export const UsuarioUpdateSchema = z.object({
  nome_usuario: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
});

// ========== AVALIAÇÃO ==========
export const AvaliacaoCreateSchema = z.object({
  id_usuario_fk: z.number().int().positive(),
  id_jogo_fk: z.number().int().positive(),
  nota: z.number().min(1).max(5, 'Nota deve estar entre 1 e 5'),
  titulo: z.string().min(5).max(255),
  texto: z.string().min(20).max(5000),
});

export const AvaliacaoUpdateSchema = AvaliacaoCreateSchema.omit({
  id_usuario_fk: true,
  id_jogo_fk: true,
}).partial();

// ========== CONTATO ==========
export const ContatoCreateSchema = z.object({
  email_contato: z.string().email(),
  tipo: z.enum(['duvida', 'sugestao', 'reclamacao', 'outro']),
  mensagem: z.string().min(10).max(1000),
});
```

#### 2.3. Middleware de validação

**Arquivo:** `src/middlewares/validation.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import HttpError from '@/errors/HttpError.ts';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const messages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      throw new HttpError(`Validação falhou: ${messages.join('; ')}`, 400);
    }
  };
};
```

#### 2.4. Usar em rotas

**Arquivo:** `src/routes/jogos.routes.ts`

```typescript
import { Router } from 'express';
import { validate } from '@/middlewares/validation.ts';
import { JogoCreateSchema, JogoUpdateSchema } from '@/schemas/index.ts';
import JogosController from '@/controllers/jogos.controller.ts';

const router = Router();

router.get('/jogos/stats', JogosController.getStats);
router.get('/jogos/destaques', JogosController.getDestaques);
router.get('/jogos', JogosController.read);
router.get('/jogos/:id', JogosController.readById);

// ✅ Validar entrada antes de passar ao controller
router.post('/jogos', validate(JogoCreateSchema), JogosController.create);
router.put('/jogos/:id', validate(JogoUpdateSchema), JogosController.update);

router.delete('/jogos/:id', JogosController.remove);

export default router;
```

---

### 3. Completar CRUD do Front-end

#### 3.1. Criar página de edição de jogo

**Arquivo:** `public/pages/jogo-admin.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>GameRate — Editar Jogo</title>
  <link rel="stylesheet" href="../css/shared.css"/>
  <style>
    .form-wrap { max-width: 700px; margin: 0 auto; padding: 40px 24px; }
    .form-section { background: var(--surface); border: 1px solid var(--border); 
                     border-radius: 12px; padding: 30px; margin-bottom: 24px; }
    .form-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; 
                   letter-spacing: 1px; margin-bottom: 24px; }
  </style>
</head>
<body>
<header class="top-bar">
  <a href="/index.html" class="logo">GAME<span>RATE</span></a>
  <nav class="nav-links">
    <a href="/pages/admin.html">← Voltar ao Admin</a>
  </nav>
</header>

<div class="page-wrap">
  <div class="form-wrap">
    <div class="form-section">
      <div class="form-title">NOVO JOGO</div>
      
      <div class="form-group">
        <label>Nome do jogo *</label>
        <input type="text" id="fNome" required/>
      </div>

      <div class="form-group">
        <label>Desenvolvedora *</label>
        <input type="text" id="fDev" required/>
      </div>

      <div class="form-group">
        <label>Data de lançamento *</label>
        <input type="date" id="fData" required/>
      </div>

      <div class="form-group">
        <label>Descrição *</label>
        <textarea id="fDesc" rows="6" required></textarea>
      </div>

      <div class="form-group">
        <label>URL da capa</label>
        <input type="url" id="fCapa" placeholder="https://example.com/image.jpg"/>
      </div>

      <div id="formErr" class="form-error" style="margin-bottom: 12px;"></div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-accent" id="btnSalvar">Salvar Jogo</button>
        <button class="btn btn-ghost" onclick="window.history.back()">Cancelar</button>
      </div>
    </div>
  </div>
</div>

<script src="/js/api.js"></script>
<script>
const user = getUser();
if (!user || user.perfil !== 'Administrador') {
  alert('Acesso restrito');
  window.location.href = '/index.html';
}

const jogoId = new URLSearchParams(location.search).get('id');

if (jogoId) {
  // Modo EDIÇÃO
  document.querySelector('.form-title').textContent = 'EDITAR JOGO';
  
  async function loadJogo() {
    try {
      const jogo = await api.get(`/jogos/${jogoId}`);
      document.getElementById('fNome').value = jogo.nome_jogo;
      document.getElementById('fDev').value = jogo.desenvolvedora;
      document.getElementById('fData').value = jogo.data_lancamento;
      document.getElementById('fDesc').value = jogo.descricao;
      document.getElementById('fCapa').value = jogo.capa || '';
    } catch (e) {
      alert('Jogo não encontrado');
      window.history.back();
    }
  }
  loadJogo();
}

document.getElementById('btnSalvar').addEventListener('click', async () => {
  const nome = document.getElementById('fNome').value.trim();
  const dev = document.getElementById('fDev').value.trim();
  const data = document.getElementById('fData').value;
  const desc = document.getElementById('fDesc').value.trim();
  const capa = document.getElementById('fCapa').value.trim();
  const err = document.getElementById('formErr');
  err.textContent = '';

  if (!nome || !dev || !data || !desc) {
    err.textContent = 'Preencha todos os campos obrigatórios';
    return;
  }

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = jogoId ? 'Atualizando...' : 'Criando...';

  try {
    const payload = { nome_jogo: nome, desenvolvedora: dev, 
                      data_lancamento: data, descricao: desc, capa };
    
    if (jogoId) {
      await api.put(`/jogos/${jogoId}`, payload);
      toast('Jogo atualizado com sucesso!', 'success');
    } else {
      await api.post('/jogos', payload);
      toast('Jogo criado com sucesso!', 'success');
    }
    
    setTimeout(() => window.location.href = '/pages/admin.html', 1500);
  } catch (e) {
    err.textContent = e.message;
    btn.disabled = false;
    btn.textContent = jogoId ? 'Atualizar' : 'Criar';
  }
});
</script>
</body>
</html>
```

---

## 🟡 IMPORTANTES

### 4. Adicionar Timestamps de Auditoria

**Arquivo:** `prisma/schema.prisma`

```prisma
model Jogo {
  id_jogo          Int                @id @default(autoincrement())
  nome_jogo        String
  desenvolvedora   String
  data_lancamento  DateTime
  descricao        String
  nota_media       Float?
  total_avaliacoes Int                @default(0)
  capa             String?
  
  createdAt        DateTime           @default(now())      // ✅ Novo
  updatedAt        DateTime           @updatedAt          // ✅ Novo

  jogo_plataforma  JogoPlataforma[]
  jogo_genero      JogoGenero[]
  avaliacao        Avaliacao[]

  @@map("jogo")
}

model Avaliacao {
  id_avaliacao    Int      @id @default(autoincrement())
  id_usuario_fk   Int
  id_jogo_fk      Int
  nota            Float
  titulo          String
  texto           String
  data_publicacao DateTime @default(now())
  
  createdAt       DateTime @default(now())     // ✅ Novo
  updatedAt       DateTime @updatedAt         // ✅ Novo

  usuario         Usuario  @relation(fields: [id_usuario_fk], references: [id_usuario])
  jogo            Jogo     @relation(fields: [id_jogo_fk], references: [id_jogo])

  @@unique([id_usuario_fk, id_jogo_fk])
  @@map("avaliacao")
}
```

**Depois fazer:**
```bash
npm run db:migrate
```

---

### 5. Implementar Soft Delete

**Arquivo:** `prisma/schema.prisma`

```prisma
model Jogo {
  // ... campos anteriores ...
  deletedAt       DateTime?          // ✅ Novo - soft delete

  @@map("jogo")
}
```

**Atualizar queries para filtrar soft-deleted:**

```typescript
// src/models/jogo.model.ts
async function readAll(filter?: JogoFilter): Promise<JogoResumo[]> {
  const where: any = { deletedAt: null };  // ✅ Filtrar deletados
  
  if (filter?.search) where.nome_jogo = { contains: filter.search, mode: 'insensitive' };
  if (filter?.genero) where.jogo_genero = { some: { genero: { nome_genero: filter.genero } } };
  if (filter?.plataforma) where.jogo_plataforma = { some: { plataforma: { nome_plataforma: filter.plataforma } } };

  const rows = await prisma.jogo.findMany({ 
    where, 
    orderBy: { nome_jogo: 'asc' }
  });
  // ... resto do código
}

async function remove(id: number): Promise<boolean> {
  try {
    // Soft delete (marcar como deletado, não remover)
    await prisma.jogo.update({
      where: { id_jogo: id, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    return true;
  } catch (e) {
    throw new HttpError('Jogo não encontrado', 404);
  }
}
```

---

### 6. Testes de Erro na API

**Arquivo:** `request.http` (adicionar ao final)

```http
# =============================================================
#  TESTES DE ERRO — Casos inválidos e edge cases
# =============================================================

### [ERRO] Login com email inexistente
POST {{base}}/auth/login
Content-Type: application/json

{
  "email": "naoexiste@teste.com",
  "senha": "qualquersenha"
}

###

### [ERRO] Cadastro com email duplicado
POST {{base}}/auth/cadastro
Content-Type: application/json

{
  "nome_usuario": "NovoUser",
  "email": "admin@gamerate.com",
  "senha": "senha123"
}

###

### [ERRO] Criar jogo sem campos obrigatórios
POST {{base}}/jogos
Content-Type: application/json

{
  "nome_jogo": "Teste"
}

###

### [ERRO] Atualizar jogo inexistente
PUT {{base}}/jogos/99999
Content-Type: application/json

{
  "nome_jogo": "Teste"
}

###

### [ERRO] Avaliação duplicada (mesmo usuário, mesmo jogo)
POST {{base}}/avaliacoes
Content-Type: application/json

{
  "id_usuario_fk": 1,
  "id_jogo_fk": 1,
  "nota": 5,
  "titulo": "Segunda avaliação",
  "texto": "Isso deveria retornar erro 409"
}

###

### [ERRO] Nota fora do intervalo [1,5]
POST {{base}}/avaliacoes
Content-Type: application/json

{
  "id_usuario_fk": 1,
  "id_jogo_fk": 2,
  "nota": 10,
  "titulo": "Nota inválida",
  "texto": "Uma nota de 10 não deveria ser aceita"
}

###

### [ERRO] Deletar recurso inexistente
DELETE {{base}}/jogos/99999

###

### [ERRO] Buscar jogo inexistente
GET {{base}}/jogos/99999

###
```

---

### 7. Melhorar Tratamento de Erros

**Arquivo:** `src/models/jogo.model.ts`

```typescript
import { Prisma } from '@prisma/client';
import HttpError from '@/errors/HttpError.ts';

async function create({ nome_jogo, ... }: JogoInput): Promise<Jogo> {
  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
    throw new HttpError('Campos obrigatórios: nome_jogo, desenvolvedora, data_lancamento, descricao', 400);
  }

  try {
    const lancamento = new Date(data_lancamento);
    if (isNaN(lancamento.getTime())) {
      throw new HttpError('data_lancamento inválida (formato: YYYY-MM-DD)', 400);
    }

    const r = await prisma.jogo.create({
      data: {
        nome_jogo: nome_jogo.trim(),
        desenvolvedora: desenvolvedora.trim(),
        data_lancamento: lancamento,
        descricao: descricao.trim(),
        capa: capa ? capa.trim() : null,
      },
    });

    return readById(r.id_jogo);
  } catch (error) {
    // ✅ Tratamento específico de erros Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new HttpError('Jogo já existe', 409);
      }
      if (error.code === 'P2003') {
        throw new HttpError('Referência inválida (gênero ou plataforma não existe)', 400);
      }
    }
    
    if (error instanceof HttpError) throw error;
    
    throw new HttpError('Erro ao criar jogo', 500);
  }
}

async function update({ id, nome_jogo, ... }: JogoInput & { id?: number }): Promise<Jogo> {
  if (!id) {
    throw new HttpError('ID do jogo é obrigatório', 400);
  }

  // Verificar se jogo existe
  const existe = await prisma.jogo.findUnique({ where: { id_jogo: id } });
  if (!existe) {
    throw new HttpError('Jogo não encontrado', 404);
  }

  try {
    const updates: any = {};
    if (nome_jogo !== undefined) updates.nome_jogo = nome_jogo.trim();
    if (desenvolvedora !== undefined) updates.desenvolvedora = desenvolvedora.trim();
    // ... outros campos

    await prisma.jogo.update({
      where: { id_jogo: id },
      data: updates,
    });

    return readById(id);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar jogo', 500);
  }
}
```

---

## 🟢 OPCIONAIS

### 8. Implementar JWT para Sessões

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

**Arquivo:** `src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

export const generateToken = (userId: number, perfil: string) => {
  return jwt.sign({ userId, perfil }, SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET) as { userId: number; perfil: string };
  } catch {
    return null;
  }
};
```

**Middleware:** `src/middlewares/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.ts';
import HttpError from '@/errors/HttpError.ts';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new HttpError('Token não fornecido', 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw new HttpError('Token inválido ou expirado', 401);
  }

  (req as any).userId = decoded.userId;
  (req as any).perfil = decoded.perfil;
  next();
};
```

---

## 📋 Checklist de Implementação

```
Segurança:
  [ ] Hash de senhas com Bcrypt
  [ ] Validação com Zod em todas rotas
  [ ] Middleware de auth com JWT
  [ ] Sanitização de entrada HTML/SQL

Backend:
  [ ] Campos de auditoria (createdAt, updatedAt)
  [ ] Soft delete (deletedAt)
  [ ] Testes de erro em request.http
  [ ] Tratamento específico de erros Prisma

Frontend:
  [ ] Página de criar/editar jogo
  [ ] Formulário de criar avaliação
  [ ] Interface de editar perfil
  [ ] Loading states e validação de form
  [ ] Confirmação antes de delete

Documentação:
  [ ] AGENTS.md com diretrizes
  [ ] .env.example
  [ ] Comentários em código complexo
  [ ] Swagger/OpenAPI (opcional)
```

---

## 📚 Referências

- [Bcrypt.js](https://www.npmjs.com/package/bcrypt)
- [Zod Validation](https://zod.dev/)
- [Prisma Error Codes](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [JWT.io](https://jwt.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Última Atualização:** 28/06/2026
