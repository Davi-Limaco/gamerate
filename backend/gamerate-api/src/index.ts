import { errorHandler, notFoundHandler } from '@/middlewares/errorHandlers.js';
import express from 'express';
import morgan from 'morgan';

import jogosRoutes      from '@/routes/jogos.routes.js';
import avaliacoesRoutes from '@/routes/avaliacoes.routes.js';
import usuariosRoutes   from '@/routes/usuarios.routes.js';
import authRoutes       from '@/routes/auth.routes.js';
import catalogRoutes    from '@/routes/catalog.routes.js';
import contatoRoutes    from '@/routes/contato.routes.js';

const app = express();

app.use(morgan('dev'));

app.use(express.static('public'));

app.use(express.json());

app.use('/api', jogosRoutes);
app.use('/api', avaliacoesRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', contatoRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(3000, () => console.log('GameRate API listening on port 3000'));