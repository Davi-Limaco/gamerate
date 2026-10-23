import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

/** Clica na seta até ela se desabilitar (fim do percurso). A seta pode ser desabilitada no meio do
 * clique, quando a rolagem suave termina, por isso o clique tolera esse caso. */
async function clicarAteDesabilitar(page: Page, seta: Locator) {
  for (let i = 0; i < 10 && !(await seta.isDisabled()); i++) {
    await seta.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(600);
  }
}

test.describe('página inicial: carrosséis com setas', () => {
  // Monitor largo: antes, com poucos cards, tudo cabia na tela e as setas não faziam nada.
  test.use({ viewport: { width: 1920, height: 1000 } });

  test('as setas rolam o carrossel, habilitam/desabilitam nas pontas e chegam ao último jogo', async ({ page }) => {
    await page.goto('/index.html');
    const linha = page.locator('#rowLancamentos');
    const direita = page.getByRole('button', { name: 'Rolar para a direita' }).first();
    const esquerda = page.getByRole('button', { name: 'Rolar para a esquerda' }).first();

    await expect(linha.locator('.game-card')).toHaveCount(12);
    await expect(direita).toBeVisible();
    // No começo não há para onde voltar
    await expect(esquerda).toBeDisabled();
    await expect(direita).toBeEnabled();

    await direita.click();
    await expect.poll(() => linha.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expect(esquerda).toBeEnabled();

    // Continua clicando até o fim: a seta da direita se desabilita na última posição
    await clicarAteDesabilitar(page, direita);
    await expect(direita).toBeDisabled();
    await expect(esquerda).toBeEnabled();

    // E dá para voltar ao início
    await clicarAteDesabilitar(page, esquerda);
    await expect(esquerda).toBeDisabled();
    await expect.poll(() => linha.evaluate((el) => el.scrollLeft)).toBe(0);
  });

  test('o segundo carrossel (mais bem avaliados) também rola de forma independente', async ({ page }) => {
    await page.goto('/index.html');
    const melhores = page.locator('#rowMelhores');
    const primeira = page.locator('#rowLancamentos');
    await expect(melhores.locator('.game-card')).toHaveCount(12);

    await page.getByRole('button', { name: 'Rolar para a direita' }).nth(1).click();
    await expect.poll(() => melhores.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect(await primeira.evaluate((el) => el.scrollLeft)).toBe(0);
  });
});

test.describe('catálogo sem paginação', () => {
  test('mostra todos os jogos em uma única página, sem botões de página', async ({ page }) => {
    await page.goto('/pages/catalogo.html');
    await expect(page.getByText('24 jogos encontrados')).toBeVisible();
    await expect(page.locator('.game-card')).toHaveCount(24);
    await expect(page.locator('#pagination')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '2', exact: true })).toHaveCount(0);
  });

  test('a busca continua filtrando a lista inteira', async ({ page }) => {
    await page.goto('/pages/catalogo.html');
    await expect(page.locator('.game-card')).toHaveCount(24);
    await page.getByPlaceholder('Pesquisar jogos...').fill('Souls');
    await page.keyboard.press('Enter');
    await expect(page.locator('.game-card')).toHaveCount(1);
    await expect(page.getByText('1 jogos encontrados')).toBeVisible();
  });
});
