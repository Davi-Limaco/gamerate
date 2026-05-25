# 🎮 GameRate

A full-stack web platform for rating and reviewing electronic games, built as an academic project at IFPB (Instituto Federal da Paraíba).

## 📖 About

GameRate permite que jogadores descubram jogos, postem avaliações e consultem informações em um único lugar. A aplicação oferece catálogo de jogos, cadastro e login de usuários, gestão de avaliações, e gestão de catálogo de gêneros, plataformas e perfis.

## ✨ Features

- 🏠 **Home** — Exibição de jogos em destaque, estatísticas e descoberta de títulos
- 🎮 **Game Catalog** — Busca e filtragem por gênero e plataforma
- 📝 **Reviews** — Criação, edição e exclusão de avaliações de jogos
- 👤 **Usuários** — Cadastro, login e gerenciamento de perfis de usuário
- 📬 **Contact Form** — Envio de mensagens de contato pelo site
- 🛠️ **Admin Panel** — Dashboard para gerenciar jogos, usuários, categorias e contatos

## 🛠️ Tech Stack

**Backend**
- Node.js + Express
- SQLite database
- `morgan` request logging

**Frontend**
- Vanilla HTML, CSS e JavaScript
- Design responsivo com CSS customizado
- Consumo de API via Fetch

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### 1. Local Setup

```bash
cd backend/gamerate-api
npm install
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

### 2. Database Setup

O projeto usa um arquivo SQLite local em `backend/gamerate-api/src/database/db.sqlite`.

Para recriar o banco de dados com dados de seed:

```bash
npm run db:drop
npm run db:load
```

Também existe um comando combinado:

```bash
npm run db:reload
```

## 📁 Project Structure

```
gamerate/
├── backend/
│   └── gamerate-api/
│       ├── docs/                   # Documentação e ERD
│       ├── public/                 # Frontend estático servido pela API
│       │   ├── assets/
│       │   ├── css/
│       │   ├── js/
│       │   └── pages/
│       ├── src/
│       │   ├── controllers/        # Handlers de requisição
│       │   ├── database/           # Configuração SQLite e seeds
│       │   ├── models/             # Lógica SQL e acesso a dados
│       │   ├── routes/             # Definição de endpoints
│       │   ├── index.js            # Entrada do servidor Express
│       │   └── routes.js           # Router central da API
│       ├── package.json
│       └── package-lock.json
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

## 🏗️ Architecture

A arquitetura do backend segue o padrão **Route → Controller → Model**:

- **Routes** definem os endpoints e delegam para o Controller
- **Controllers** tratam validações e chamam os models
- **Models** executam SQL e retornam dados

```
Request → Route → Controller → Model → Response
```

### Models Overview

| Model | Responsibilities |
|---|---|
| `Jogo` | Consultas de jogos, filtros, detalhes, estatísticas e CRUD |
| `Avaliacao` | Consultas de avaliações, criação, edição e remoção |
| `Usuario` | Autenticação, cadastro, leitura e atualização de usuários |
| `Categoria` / `Perfil` / `Contato` | Dados auxiliares para gêneros, plataformas, perfis e mensagens |

## 🔌 API Endpoints

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

## 🔑 Default Admin

Após rodar os seeds:
- **Email:** admin@gamerate.com
- **Password:** admin123

> ⚠️ Altere a senha após o primeiro login.

## 👥 Team

- Arthur Vinícius França Silva
- Davi Lima de Carvalho Oliveira

IFPB — Instituto Federal de Educação, Ciência e Tecnologia da Paraíba
