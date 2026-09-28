export interface ValidationIssue {
  path: string;
  message: string;
}

class HttpError extends Error {
  code: number;
  issues?: ValidationIssue[];

  constructor(message: string, code: number = 400, issues?: ValidationIssue[]) {
    super(message);
    this.code = code;
    this.issues = issues;
  }
}

export default HttpError;
