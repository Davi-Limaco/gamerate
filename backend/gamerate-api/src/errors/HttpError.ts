class HttpError extends Error {
  code: number;

  constructor(message: string, code: number = 400) {
    super(message);
    this.code = code;
  }
}

export default HttpError;
