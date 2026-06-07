class HttpError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
    }
}
export default HttpError;
