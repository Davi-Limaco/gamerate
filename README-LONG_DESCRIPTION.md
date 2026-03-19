# GameRate

A full-stack web platform for rating and reviewing electronic games, built as an academic project at IFPB (Instituto Federal da Paraíba).

# About

GameRate allows players to discover, evaluate and discuss games in a centralized and structured way — going beyond the superficial reviews found on digital stores. Users can write detailed reviews with scores, comment on other players' analyses, like their favorite reviews, and follow other users.

# Features

- **Home** — Featured releases, top-rated games, highlighted reviews and genre browsing, all loaded dynamically from the database
- **Game Catalog** — Filter and sort games by genre, platform, rating and release date with pagination
- **Reviews** — Write, edit and delete detailed game reviews with a score from 1 to 5
- **Likes & Comments** — Interact with other users' reviews
- **User Profile** — View review history, manage followers and edit personal info
- **Notifications** — Get notified about new likes, comments and followers
- **Contact Form** — Send questions, reports or bug reports directly to the admin team
- **Admin Panel** — Full dashboard to manage games, users, reviews and contact messages

## Tech Stack

**Backend**
- Node.js + Express
- MySQL 8 with mysql2 driver
- JWT authentication (jsonwebtoken)
- Password hashing (bcryptjs)

**Frontend**
- Vanilla HTML, CSS and JavaScript (no frameworks)
- Custom design system with CSS Variables
- Dynamic page rendering via Fetch API
- Fully responsive layout

**Database**
- Relational schema with 14 tables
- Entities: users, profiles, games, genres, platforms, reviews, comments, likes, followers, notifications and contact messages

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/gamerate.git
cd gamerate/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MySQL credentials
```

### Database Setup
```sql
CREATE DATABASE gamerate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gamerate;
-- Run schema.sql then seed.sql
```

### Run
```bash
npm run dev
# Server running at http://localhost:3001
```

### Default Admin Account
- **Email:** admin@gamerate.com
- **Password:** admin123

> Change the password after first login.

## Project Structure
```
gamerate/
├── backend/
│   ├── db/              # Database connection, schema and seed
│   ├── middleware/      # JWT authentication middleware
│   ├── routes/          # API route handlers
│   └── server.js        # Express entry point
└── frontend/
    ├── css/             # Shared design system
    ├── js/              # API client and global helpers
    ├── pages/           # All HTML pages
    └── index.html       # Home page
```

## Team

- Arthur Vinícius França Silva
- Davi Lima de Carvalho Oliveira

IFPB — Instituto Federal de Educação, Ciência e Tecnologia da Paraíba
