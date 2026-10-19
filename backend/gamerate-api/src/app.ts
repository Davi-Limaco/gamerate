import 'dotenv/config';

import { errorHandler, notFoundHandler } from '@/middlewares/errorHandlers.ts';
import express from 'express';
import morgan from 'morgan';
import { UPLOAD_ROOT, ensureUploadDirs } from '@/utils/uploads.ts';

import jogosRoutes      from '@/routes/jogos.routes.ts';
import avaliacoesRoutes from '@/routes/avaliacoes.routes.ts';
import imagemRoutes     from '@/routes/imagem.routes.ts';
import usuariosRoutes   from '@/routes/usuarios.routes.ts';
import authRoutes       from '@/routes/auth.routes.ts';
import catalogRoutes    from '@/routes/catalog.routes.ts';
import contatoRoutes    from '@/routes/contato.routes.ts';

// O `app` é montado e exportado aqui, SEM chamar `listen`. Assim os testes de
// rotas (supertest) usam o app diretamente, sem abrir porta; quem sobe o
// servidor de verdade é o src/index.ts.
const app = express();

// Log de requisições desligado nos testes (NODE_ENV=test) para não poluir a saída.
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }));

app.use(express.static('public'));

// Uploads (fotos de perfil) servidos como conteúdo estático em /uploads/...
// Os nomes são UUIDs imutáveis, então o cache longo é seguro. `nosniff` impede
// o navegador de "adivinhar" outro tipo de conteúdo; dotfiles e listagem de
// diretório ficam desabilitados.
ensureUploadDirs();
app.use('/uploads', express.static(UPLOAD_ROOT, {
  dotfiles: 'deny',
  index: false,
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

app.use(express.json());

app.use('/api', jogosRoutes);
app.use('/api', avaliacoesRoutes);
// imagemRoutes ANTES de usuariosRoutes: `/usuarios/imagem` não pode cair em `/usuarios/:id`.
app.use('/api', imagemRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', contatoRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
