/**
 * index.ts — Servidor Express principal
 */

import express from 'express';
import morgan from 'morgan';

import route from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { contentTypeJson } from './middlewares/contentType.js';

const app = express();

app.use(morgan('dev'));

app.use(express.static('public'));

app.use(express.json());

// Middleware para garantir Content-Type
app.use(contentTypeJson);

app.use('/api', route);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

app.listen(3000, () => console.log('GameRate API listening on port 3000'));
