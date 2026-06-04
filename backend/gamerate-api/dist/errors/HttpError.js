export class HttpError extends Error {
    status;
    constructor(message, status = 500) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}
