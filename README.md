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
| `DATABASE_URL` | Your Supabase connection URI |
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
│   │   ├── connection.js   # PostgreSQL pool
│   │   ├── schema.sql      # Table definitions
│   │   └── seed.sql        # Initial data
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── routes/
│   │   ├── auth.js         # Login / register
│   │   ├── jogos.js        # Games CRUD
│   │   ├── avaliacoes.js   # Reviews + likes + comments
│   │   ├── usuarios.js     # Profile + follow
│   │   └── misc.js         # Contact, genres, platforms
│   ├── .env.example        # Environment template
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/
    │   └── shared.css
    ├── js/
    │   └── api.js
    ├── pages/
    │   ├── login.html
    │   ├── cadastro.html
    │   ├── catalogo.html
    │   ├── jogo.html
    │   ├── avaliacao.html
    │   ├── perfil.html
    │   ├── contato.html
    │   └── admin.html
    └── index.html
```

## 🔑 Default Admin

After running `seed.sql`:
- **Email:** admin@gamerate.com
- **Password:** admin123

> ⚠️ Change the password after first login.

## 🔌 API Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/cadastro` | Register | — |
| POST | `/api/auth/login` | Login | — |
| GET | `/api/jogos` | List games (filters + pagination) | — |
| GET | `/api/jogos/stats` | Dashboard counters | — |
| GET | `/api/jogos/destaques` | Featured releases | — |
| GET | `/api/jogos/:id` | Game detail | — |
| POST | `/api/jogos` | Create game | Admin |
| PUT | `/api/jogos/:id` | Edit game | Admin |
| DELETE | `/api/jogos/:id` | Delete game | Admin |
| GET | `/api/avaliacoes` | List reviews | — |
| GET | `/api/avaliacoes/destaque` | Top reviews | — |
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
| GET | `/api/generos` | List genres | — |
| GET | `/api/plataformas` | List platforms | — |
| POST | `/api/contato` | Send contact message | — |
| GET | `/api/ping` | Health check | — |
| GET | `/api/diagnostico` | Connection diagnostics | — |

## 👥 Team

- Arthur Vinícius França Silva
- Davi Lima de Carvalho Oliveira

IFPB — Instituto Federal de Educação, Ciência e Tecnologia da Paraíba
