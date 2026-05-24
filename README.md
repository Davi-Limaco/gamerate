# 🎮 GameRate

A full-stack web platform for rating and reviewing electronic games, built as an academic project at IFPB (Instituto Federal da Paraíba).

## 📖 About

GameRate allows players to discover, evaluate and discuss games in a centralized and structured way. Users can write detailed reviews with scores, comment on other players' analyses, like their favorite reviews, and follow other users.

## ✨ Features

- 🏠 **Home** — Featured releases, top-rated games, highlighted reviews, trailer section and genre browsing
- 🎮 **Game Catalog** — Filter and sort games by genre, platform, rating and release date with pagination
- 📝 **Reviews** — Write, edit and delete detailed game reviews with a score from 1 to 5
- ❤️ **Likes & Comments** — Interact with other users' reviews
- 👤 **User Profile** — View review history, manage followers and edit personal info
- 🔔 **Notifications** — Get notified about new likes, comments and followers
- 📬 **Contact Form** — Send questions, reports or bug reports
- 🛠️ **Admin Panel** — Full dashboard to manage games, users, reviews and contact messages

## 🛠️ Tech Stack

**Backend**
- Node.js + Express
- SQLite database
- `morgan` request logging

**Frontend**
- Vanilla HTML, CSS and JavaScript
- Custom design system with CSS Variables
- Dynamic rendering via Fetch API
- Fully responsive

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### 1. Local Setup

```bash
cd backend/gamerate-api
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

### 2. Database Setup

The project uses a local SQLite database file at `backend/gamerate-api/src/database/db.sqlite`.

To reset and reload the database with seeded data:

```bash
npm run db:drop
npm run db:load
```

## 📁 Project Structure

```
gamerate/
├── backend/
│   └── gamerate-api/
│       ├── docs/                   # Project documentation and ERD
│       ├── public/                 # Static frontend assets served by the API
│       │   ├── assets/
│       │   ├── css/
│       │   ├── js/
│       │   └── pages/
│       ├── src/
│       │   ├── controllers/        # Request handlers for each route group
│       │   ├── database/           # SQLite setup, migration and seed scripts
│       │   ├── models/             # Data access and SQL logic
│       │   ├── routes/             # Route definitions
│       │   ├── index.js            # Express entry point
│       │   └── routes.js           # Central API router
│       ├── package.json
│       └── package-lock.json
└── frontend/
    ├── assets/
    ├── css/
    │   └── shared.css              # Global design system
    ├── js/
    │   └── api.js                  # HTTP client + auth helpers + utilities
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

The backend follows a **Route → Model** pattern to separate HTTP concerns from database logic:

- **Routes** handle HTTP requests and delegate to controllers
- **Controllers** validate the request and call models
- **Models** execute SQL and return data

```
Request → Route → Controller → Model → Response
```

### Models Overview

| Model | Responsibilities |
|---|---|
| `Jogo` | Game queries, filtering, detail, stats, featured games, CRUD |
| `Avaliacao` | Review queries, likes, comments, rating updates |
| `Usuario` | User authentication, profile, follow system, notifications |
| `Categoria` / `Perfil` / `Contato` | Auxiliary data and contact handling |

## 🔌 API Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/cadastro` | Register | — |
| POST | `/api/auth/login` | Login | — |
| GET | `/api/jogos` | List games (filters + pagination) | — |
| GET | `/api/jogos/stats` | Dashboard counters | — |
| GET | `/api/jogos/destaques` | Featured releases + top rated | — |
| GET | `/api/jogos/:id` | Game detail + genres + platforms | — |
| POST | `/api/jogos` | Create game | Admin |
| PUT | `/api/jogos/:id` | Edit game | Admin |
| DELETE | `/api/jogos/:id` | Delete game | Admin |
| GET | `/api/avaliacoes` | List reviews | — |
| GET | `/api/avaliacoes/destaque` | Top liked reviews | — |
| GET | `/api/avaliacoes/:id` | Review detail + comments | — |
| POST | `/api/avaliacoes` | Create review | Auth |
| PUT | `/api/avaliacoes/:id` | Edit review | Owner/Admin |
| DELETE | `/api/avaliacoes/:id` | Delete review | Owner/Admin |
| POST | `/api/avaliacoes/:id/curtir` | Toggle like | Auth |
| POST | `/api/avaliacoes/:id/comentar` | Add comment | Auth |
| GET | `/api/usuarios/me` | My profile | Auth |
| PUT | `/api/usuarios/me` | Edit profile | Auth |
| GET | `/api/usuarios/me/avaliacoes` | My reviews | Auth |
| GET | `/api/usuarios/me/notificacoes` | My notifications | Auth |
| POST | `/api/usuarios/:id/seguir` | Toggle follow | Auth |
| GET | `/api/usuarios` | List all users | Admin |
| DELETE | `/api/usuarios/:id` | Delete user | Admin |
| GET | `/api/generos` | List genres | — |
| GET | `/api/plataformas` | List platforms | — |
| POST | `/api/contato` | Send contact message | — |
| GET | `/api/contato` | List contact messages | Admin |
| GET | `/api/ping` | Health check | — |
| GET | `/api/diagnostico` | Connection diagnostics | — |

## 🔑 Default Admin

After running the seed script:
- **Email:** admin@gamerate.com
- **Password:** admin123

> ⚠️ Change the password after first login.

## 👥 Team

- Arthur Vinícius França Silva
- Davi Lima de Carvalho Oliveira

IFPB — Instituto Federal de Educação, Ciência e Tecnologia da Paraíba
