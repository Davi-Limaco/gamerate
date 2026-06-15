import { errorHandler, notFoundHandler } from '@/middlewares/errorHandlers.ts';
import express from 'express';
import morgan from 'morgan';

import jogosRoutes      from '@/routes/jogos.routes.ts';
import avaliacoesRoutes from '@/routes/avaliacoes.routes.ts';
import usuariosRoutes   from '@/routes/usuarios.routes.ts';
import authRoutes       from '@/routes/auth.routes.ts';
import catalogRoutes    from '@/routes/catalog.routes.ts';
import contatoRoutes    from '@/routes/contato.routes.ts';

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