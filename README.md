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
- Node.js + Express (CommonJS)
- PostgreSQL via Supabase
- `pg` driver
- JWT authentication (jsonwebtoken)
- Password hashing (bcryptjs)

**Frontend**
- Vanilla HTML, CSS and JavaScript
- Custom design system with CSS Variables
- Dynamic rendering via Fetch API
- Fully responsive

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free)

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `backend/db/schema.sql`
3. Then run `backend/db/seed.sql`
4. Go to **Project Settings → Database → Connection string → URI** and copy the URL

### 2. Local Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL
npm install
npm run dev
# Server at http://localhost:3001
```

### 3. Deploy on Render

1. Push to GitHub (make sure `.env` is NOT committed)
2. Create a **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repository
4. Configure:

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |

5. Add **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase Session Pooler URI |
| `JWT_SECRET` | A secure random string |

6. Click **Create Web Service**

### 4. Elevate Admin Account

After registering your account, run in Supabase SQL Editor:

```sql
UPDATE usuario 
SET id_perfil_fk = 3 
WHERE email = 'seu@email.com';
```

Then log out and log back in. Access the admin panel at `/pages/admin.html`.

## 📁 Project Structure

```
gamerate/
├── backend/
│   ├── db/
│   │   ├── connection.js        # PostgreSQL connection pool
│   │   ├── schema.sql           # Table definitions
│   │   └── seed.sql             # Initial data (profiles, platforms, genres, games)
│   ├── middleware/
│   │   └── auth.js              # JWT validation middleware
│   ├── models/
│   │   ├── JogoModel.js         # Game queries (list, detail, create, update, delete)
│   │   ├── AvaliacaoModel.js    # Review queries + likes + comments
│   │   ├── UsuarioModel.js      # User queries + follow system + notifications
│   │   └── MiscModel.js         # Genre, platform and contact queries
│   ├── routes/
│   │   ├── auth.js              # POST /api/auth/login, /api/auth/cadastro
│   │   ├── jogos.js             # GET|POST|PUT|DELETE /api/jogos
│   │   ├── avaliacoes.js        # GET|POST|PUT|DELETE /api/avaliacoes
│   │   ├── usuarios.js          # GET|PUT /api/usuarios
│   │   └── misc.js              # /api/generos, /api/plataformas, /api/contato
│   ├── .env.example             # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                # Express entry point
└── frontend/
    ├── css/
    │   └── shared.css           # Global design system (CSS Variables, components)
    ├── js/
    │   └── api.js               # HTTP client + auth helpers + global utilities
    ├── pages/
    │   ├── login.html           # Login page
    │   ├── cadastro.html        # Register page
    │   ├── catalogo.html        # Game catalog with filters and pagination
    │   ├── jogo.html            # Game detail + reviews
    │   ├── avaliacao.html       # Review detail + comments + likes
    │   ├── perfil.html          # User profile + history + settings
    │   ├── contato.html         # Contact form
    │   └── admin.html           # Admin dashboard
    └── index.html               # Home page
```

## 🏗️ Architecture

The backend follows a **Route → Model** pattern to separate HTTP concerns from database logic:

- **Routes** handle HTTP requests, validate inputs and return responses
- **Models** contain all database queries and business logic

```
Request → Route (auth, validation) → Model (SQL query) → Response
```

### Models Overview

| Model | Responsibilities |
|---|---|
| `JogoModel` | List games with filters/pagination, game detail, stats, featured games, CRUD |
| `AvaliacaoModel` | List/create/edit/delete reviews, toggle likes, add comments, update game rating |
| `UsuarioModel` | Register, login lookup, profile CRUD, follow system, notifications, admin ops |
| `MiscModel` | List genres and platforms with game counts, contact message CRUD |

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

After running `seed.sql`:
- **Email:** admin@gamerate.com
- **Password:** admin123

> ⚠️ Change the password after first login.

## 👥 Team

- Arthur Vinícius França Silva
- Davi Lima de Carvalho Oliveira

IFPB — Instituto Federal de Educação, Ciência e Tecnologia da Paraíba
