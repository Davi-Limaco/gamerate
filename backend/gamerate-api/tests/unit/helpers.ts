import type { NextFunction, Request, Response } from 'express';

/** Resposta falsa do Express: guarda status e corpo para as asserções. */
export function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res as typeof res & Response;
}

/** Requisição falsa com os campos que cada teste precisar. */
export function fakeReq(overrides: Record<string, unknown> = {}): Request {
  return { headers: {}, params: {}, query: {}, body: {}, ...overrides } as unknown as Request;
}

/** `next` que registra o que recebeu (nenhum argumento = seguiu adiante). */
export function fakeNext() {
  const calls: unknown[][] = [];
  const next = ((...args: unknown[]) => { calls.push(args); }) as NextFunction;
  return Object.assign(next, { calls });
}
