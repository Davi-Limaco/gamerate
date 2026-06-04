import { HttpError } from '@/errors/HttpError';
export const errorHandler = (err, _req, res, _next) => {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err?.message ?? 'Erro interno no servidor.';
    console.error(err);
    res.status(status).json({ message });
};
