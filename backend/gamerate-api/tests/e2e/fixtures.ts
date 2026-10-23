import { expect, test as base } from '@playwright/test';

/**
 * `test` com o navegador isolado da internet: qualquer requisição para fora do servidor da
 * aplicação (YouTube, Google Fonts, miniaturas externas...) é abortada na hora.
 *
 * Por quê: a página inicial embute um iframe do YouTube. Se o YouTube estiver lento ou
 * bloqueado, o evento "load" da página nunca dispara e o teste estoura o tempo, por um motivo
 * que não tem relação com o GameRate. Assim os testes só dependem do que é nosso, rodam
 * iguais com ou sem internet e ficam bem mais rápidos.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const origem = new URL(baseURL!).origin;
    await context.route((url) => url.origin !== origem && url.protocol.startsWith('http'), (rota) => rota.abort());
    await use(context);
  },
});

export { expect };
