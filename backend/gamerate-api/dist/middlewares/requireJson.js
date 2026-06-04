import { HttpError } from '@/errors/HttpError';
export function requireJson(req, _res, next) {
    if (req.method === 'POST' || req.method === 'PUT') {
        const contentType = req.headers['content-type'] ?? '';
        if (!contentType.toString().includes('application/json')) {
            throw new HttpError('Content-Type deve ser application/json', 415);
        }
    }
    next();
}
