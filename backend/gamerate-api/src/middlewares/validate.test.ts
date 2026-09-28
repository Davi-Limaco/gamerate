import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import { validate } from '@/middlewares/validate.ts';

describe('validate middleware', () => {
  it('should reject invalid payloads', () => {
    const req = {
      body: { nome_usuario: 123 },
      params: {},
      query: {},
    } as any;

    let statusCode = 200;
    let payload: unknown;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (value: unknown) => {
            payload = value;
          },
        };
      },
    } as any;

    const next = () => {
      throw new Error('next should not be called for invalid payload');
    };

    validate(z.object({ nome_usuario: z.string().min(2) }))(req, res, next);

    assert.equal(statusCode, 400);
    assert.ok(payload);
  });
});
