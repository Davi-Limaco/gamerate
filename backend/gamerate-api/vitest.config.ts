import { defineConfig } from 'vitest/config';

// Testes do front-end (Vitest + JSDOM): sem navegador, sem servidor, sem rede.
// `fetch` e `localStorage` são substituídos por dublês dentro de cada teste.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/front/**/*.test.js'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['public/js/**/*.js'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage/front',
      // Piso de cobertura: se a suíte regredir abaixo disto, o comando falha.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
