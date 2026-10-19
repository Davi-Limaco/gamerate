import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de ponta a ponta (E2E): um navegador real percorre a aplicação inteira
 * (front-end + API + banco). São mais lentos que os testes de unidade/rotas,
 * por isso rodam à parte (`npm run e2e`), não a cada alteração.
 *
 * O servidor é iniciado pelo próprio Playwright (`webServer`) com o ambiente
 * tests/env/e2e.env: porta 3100, banco SQLite descartável e e-mail desligado.
 * O script `e2e:server` recria esse banco (migrations + seed) antes de subir a
 * API, então cada execução começa de um estado conhecido, sem tocar no banco
 * de desenvolvimento.
 */
const PORT = 3100;

export default defineConfig({
  testDir: 'tests/e2e',
  // Um único arquivo SQLite compartilhado: sem paralelismo entre testes.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run e2e:server',
    url: `http://localhost:${PORT}/api/jogos/stats`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
  },
});
