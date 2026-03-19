
```
gamerate/
├── backend/
│   ├── db/
│   │   ├── connection.js     # Pool de conexão MySQL
│   │   ├── seed.sql          # Dados iniciais
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # Login / cadastro
│   │   ├── jogos.js          # CRUD jogos + filtros
│   │   ├── avaliacoes.js     # CRUD avaliações + curtidas + comentários
│   │   ├── usuarios.js       # Perfil + seguir + admin
│   │   └── misc.js           # Contato, gêneros, plataformas
│   ├── server.js             # Entrypoint Express
│   ├── .env.example          # Variáveis de ambiente
│   └── package.json
│
└── frontend/
    ├── css/
    │   └── shared.css        # Design system completo
    ├── js/
    │   └── api.js            # Cliente HTTP + helpers
    ├── pages/
    │   ├── login.html        # Tela de login
    │   ├── cadastro.html     # Registro de usuário
    │   ├── catalogo.html     # Catálogo com filtros
    │   ├── jogo.html         # Detalhe do jogo + avaliações
    │   ├── avaliacao.html    # Detalhe da avaliação + comentários
    │   ├── perfil.html       # Perfil + histórico + editar
    │   ├── contato.html      # Formulário de contato
    │   └── admin.html        # Painel administrativo
    └── index.html            # Home (dados do banco)
```

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/cadastro` | Registrar usuário |
| POST | `/api/auth/login` | Login |

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/jogos` | Listar com filtros |
| GET | `/api/jogos/destaques` | Lançamentos + melhores |
| GET | `/api/jogos/stats` | Contadores para home |
| GET | `/api/jogos/:id` | Detalhe + gêneros + plataformas |
| POST | `/api/jogos` | Cadastrar (admin) |
| PUT | `/api/jogos/:id` | Editar (admin) |
| DELETE | `/api/jogos/:id` | Excluir (admin) |

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/avaliacoes` | Listar (filtro por jogo) |
| GET | `/api/avaliacoes/destaque` | Mais curtidas |
| GET | `/api/avaliacoes/:id` | Detalhe + comentários |
| POST | `/api/avaliacoes` | Criar (auth) |
| PUT | `/api/avaliacoes/:id` | Editar (dono/admin) |
| DELETE | `/api/avaliacoes/:id` | Excluir (dono/admin) |
| POST | `/api/avaliacoes/:id/curtir` | Toggle curtida (auth) |
| POST | `/api/avaliacoes/:id/comentar` | Comentar (auth) |

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/usuarios/me` | Dados do usuário logado |
| PUT | `/api/usuarios/me` | Editar perfil |
| GET | `/api/usuarios/me/avaliacoes` | Histórico |
| GET | `/api/usuarios/me/notificacoes` | Notificações |
| POST | `/api/usuarios/:id/seguir` | Toggle seguir |
| GET | `/api/usuarios` | Listar todos (admin) |
| DELETE | `/api/usuarios/:id` | Excluir (admin) |

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/generos` | Lista de gêneros |
| GET | `/api/plataformas` | Lista de plataformas |
| POST | `/api/contato` | Enviar mensagem |
| GET | `/api/contato` | Listar mensagens (admin) |
