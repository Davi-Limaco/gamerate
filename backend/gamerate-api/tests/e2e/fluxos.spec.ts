import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

// Localizadores por papel acessível (getByRole / getByLabel) e dados únicos por
// execução: nada depende de ids, classes CSS nem de dados já existentes.

const SENHA = 'senha-e2e-123';

// PNG 1x1 válido, gerado em memória (não precisa de arquivo no disco).
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function novoUsuario() {
  const id = randomUUID().slice(0, 8);
  return { nome: `e2e-${id}`, email: `e2e.${id}@example.test`, senha: SENHA };
}

/** Cria a conta direto pela API (rápido) para os testes que começam já cadastrados. */
async function cadastrarPelaApi(page: Page, usuario: ReturnType<typeof novoUsuario>) {
  const res = await page.request.post('/api/auth/cadastro', {
    data: { nome_usuario: usuario.nome, email: usuario.email, senha: usuario.senha },
  });
  expect(res.status()).toBe(201);
}

async function entrarPelaInterface(page: Page, usuario: ReturnType<typeof novoUsuario>) {
  await page.goto('/pages/login.html');
  await page.getByLabel('E-mail').fill(usuario.email);
  await page.getByLabel('Senha').fill(usuario.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/index.html');
}

test.describe('cadastro, login e avaliação de um jogo', () => {
  test('novo usuário se cadastra, avalia um jogo e vê a avaliação publicada na tela', async ({ page }) => {
    const usuario = novoUsuario();
    const titulo = `Avaliação E2E ${usuario.nome}`;

    // 1) Cadastro pelo formulário
    await page.goto('/pages/cadastro.html');
    await page.getByLabel('Nome de usuário').fill(usuario.nome);
    await page.getByLabel('E-mail').fill(usuario.email);
    await page.getByLabel('Senha', { exact: true }).fill(usuario.senha);
    await page.getByLabel('Confirmar senha').fill(usuario.senha);
    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // 2) Já autenticado: o cabeçalho mostra o nome do usuário
    await page.waitForURL('**/index.html');
    await expect(page.getByRole('link', { name: usuario.nome })).toBeVisible();

    // 3) Navega até um jogo do catálogo
    await page.getByRole('link', { name: 'Jogos' }).first().click();
    await page.waitForURL('**/catalogo.html');
    await page.getByText('Hades', { exact: true }).first().click();
    await page.waitForURL('**/jogo.html?id=*');

    // 4) Escreve a avaliação no formulário
    await page.getByRole('button', { name: /escrever avaliação/i }).first().click();
    await page.getByLabel('Nota (1 a 5)').fill('4.5');
    await page.getByLabel('Título').fill(titulo);
    await page.getByLabel(/Avaliação \(mín\. 40 caracteres\)/).fill('Texto de teste automatizado com mais de quarenta caracteres para passar na validação.');
    await page.getByRole('button', { name: 'Publicar' }).click();

    // 5) O resultado aparece na tela
    await expect(page.getByText('Avaliação publicada!')).toBeVisible();
    await expect(page.getByText(titulo)).toBeVisible();

    // 6) E a página da avaliação mostra autor e título
    await page.getByText(titulo).click();
    await page.waitForURL('**/avaliacao.html?id=*');
    await expect(page.getByText(`@${usuario.nome}`)).toBeVisible();
    await expect(page.getByText(titulo)).toBeVisible();
  });

  test('cadastro com e-mail já existente mostra o erro no formulário', async ({ page }) => {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);

    await page.goto('/pages/cadastro.html');
    await page.getByLabel('Nome de usuário').fill('Outro Nome');
    await page.getByLabel('E-mail').fill(usuario.email);
    await page.getByLabel('Senha', { exact: true }).fill(usuario.senha);
    await page.getByLabel('Confirmar senha').fill(usuario.senha);
    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // A mensagem aparece no campo e no toast: basta conferir que está visível.
    await expect(page.getByText('Usuário já cadastrado').first()).toBeVisible();
    await expect(page).toHaveURL(/cadastro\.html/);
  });

  test('login com senha errada mostra mensagem e não autentica', async ({ page }) => {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);

    await page.goto('/pages/login.html');
    await page.getByLabel('E-mail').fill(usuario.email);
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Credenciais inválidas')).toBeVisible();
    await expect(page).toHaveURL(/login\.html/);
  });

  test('visitante que abre o perfil é redirecionado para o login', async ({ page }) => {
    await page.goto('/pages/perfil.html');
    await page.waitForURL('**/login.html**');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });
});

test.describe('foto de perfil (upload)', () => {
  test('usuário envia a foto, vê no cabeçalho e no perfil, ela persiste ao recarregar e pode ser removida', async ({ page }) => {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);
    await entrarPelaInterface(page, usuario);

    await page.getByRole('link', { name: usuario.nome }).click();
    await page.waitForURL('**/perfil.html');
    await page.getByRole('button', { name: 'Alterar foto de perfil' }).click();

    const dialogo = page.getByRole('dialog', { name: 'FOTO DE PERFIL' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Enviar foto' })).toBeDisabled();

    // Escolhe o arquivo: aparece a pré-visualização e o botão é habilitado
    await dialogo.getByLabel('Escolha uma imagem').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });
    await expect(dialogo.getByRole('img', { name: 'Pré-visualização da foto escolhida' })).toHaveAttribute('src', /^blob:/);
    await dialogo.getByRole('button', { name: 'Enviar foto' }).click();

    // Resultado: feedback, modal fechado e avatar (arquivo servido pela API) no cabeçalho
    await expect(page.getByText('Foto de perfil atualizada')).toBeVisible();
    await expect(dialogo).toBeHidden();
    const avatar = page.getByRole('navigation').getByRole('img', { name: `Foto de ${usuario.nome}` });
    await expect(avatar).toHaveAttribute('src', /^\/uploads\/avatars\/[0-9a-f-]{36}\.png$/);
    await expect.poll(() => avatar.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    // Persistência: depois de recarregar, a foto continua lá (veio do banco)
    await page.reload();
    await expect(page.getByRole('navigation').getByRole('img', { name: `Foto de ${usuario.nome}` })).toBeVisible();

    // Remoção: volta para as iniciais
    await page.getByRole('button', { name: 'Alterar foto de perfil' }).click();
    page.once('dialog', (confirmacao) => confirmacao.accept());
    await page.getByRole('button', { name: 'Remover foto' }).click();
    await expect(page.getByText('Foto removida')).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('img', { name: `Foto de ${usuario.nome}` })).toHaveCount(0);
  });

  test('arquivo de tipo não permitido mostra o erro e não habilita o envio', async ({ page }) => {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);
    await entrarPelaInterface(page, usuario);
    await page.goto('/pages/perfil.html');

    await page.getByRole('button', { name: 'Alterar foto de perfil' }).click();
    const dialogo = page.getByRole('dialog', { name: 'FOTO DE PERFIL' });
    await dialogo.getByLabel('Escolha uma imagem').setInputFiles({ name: 'documento.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });

    await expect(dialogo.getByRole('alert')).toContainText('Tipo de arquivo não permitido');
    await expect(dialogo.getByRole('button', { name: 'Enviar foto' })).toBeDisabled();
  });

  test('imagem acima de 2 MB mostra o erro de tamanho', async ({ page }) => {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);
    await entrarPelaInterface(page, usuario);
    await page.goto('/pages/perfil.html');

    await page.getByRole('button', { name: 'Alterar foto de perfil' }).click();
    const dialogo = page.getByRole('dialog', { name: 'FOTO DE PERFIL' });
    const grande = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024 + 1)]);
    await dialogo.getByLabel('Escolha uma imagem').setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: grande });

    await expect(dialogo.getByRole('alert')).toContainText('muito grande');
    await expect(dialogo.getByRole('button', { name: 'Enviar foto' })).toBeDisabled();
  });
});

test.describe('perfil: jogos favoritos e gameplays', () => {
  async function abrirPerfilLogado(page: Page) {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);
    await entrarPelaInterface(page, usuario);
    await page.goto('/pages/perfil.html');
    return usuario;
  }

  test('usuário favorita um jogo do catálogo, vê no perfil, o favorito persiste e pode ser removido', async ({ page }) => {
    await abrirPerfilLogado(page);
    const secao = page.getByRole('region', { name: 'Jogos Favoritos' });
    await expect(secao.getByText('Você ainda não favoritou nenhum jogo.')).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar favorito' }).click();
    const dialogo = page.getByRole('dialog', { name: 'ADICIONAR FAVORITO' });
    await dialogo.getByLabel('Buscar jogo no catálogo').fill('Hades');
    await dialogo.getByRole('button', { name: 'Favoritar Hades' }).click();
    await expect(page.getByText('Jogo adicionado aos favoritos')).toBeVisible();

    // No próprio modal o botão passa a oferecer a remoção
    await expect(dialogo.getByRole('button', { name: 'Remover Hades dos favoritos' })).toBeVisible();
    await dialogo.getByRole('button', { name: 'Fechar' }).click();
    await expect(secao.getByRole('link', { name: /Hades/ })).toBeVisible();

    // Persistência: depois de recarregar, o favorito veio do banco
    await page.reload();
    await expect(secao.getByRole('link', { name: /Hades/ })).toBeVisible();

    await secao.getByRole('button', { name: 'Remover Hades dos favoritos' }).click();
    await expect(page.getByText('Removido dos favoritos')).toBeVisible();
    await expect(secao.getByRole('link', { name: /Hades/ })).toHaveCount(0);
  });

  test('usuário posta um print e um vídeo de gameplay, vê na galeria do perfil e exclui o print', async ({ page }) => {
    const usuario = await abrirPerfilLogado(page);
    const galeria = page.getByRole('region', { name: 'Meus Gameplays' });
    const tituloPrint = `Print ${usuario.nome}`;
    const tituloVideo = `Vídeo ${usuario.nome}`;

    // Print: escolher o arquivo mostra a pré-visualização e sugere o título
    await page.getByRole('button', { name: 'Postar gameplay' }).click();
    const dialogo = page.getByRole('dialog', { name: 'POSTAR GAMEPLAY' });
    await dialogo.getByLabel('Print ou vídeo').setInputFiles('test-files/print.jpg');
    await expect(dialogo.getByRole('img', { name: 'Pré-visualização do print escolhido' })).toHaveAttribute('src', /^blob:/);
    await dialogo.getByLabel('Título').fill(tituloPrint);
    await dialogo.getByLabel('Jogo', { exact: true }).selectOption({ label: 'Hades' });
    await dialogo.getByLabel('Descrição (opcional)').fill('Print enviado pelo teste E2E.');
    await dialogo.getByRole('button', { name: 'Postar' }).click();

    await expect(page.getByText('Gameplay postado!')).toBeVisible();
    await expect(dialogo).toBeHidden();
    const print = galeria.getByRole('img', { name: `Print: ${tituloPrint}` });
    await expect(print).toHaveAttribute('src', /^\/uploads\/midias\/[0-9a-f-]{36}\.jpg$/);
    await expect.poll(() => print.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(galeria.getByText('Hades')).toBeVisible();

    // Vídeo: pré-visualização com player e publicação
    await page.getByRole('button', { name: 'Postar gameplay' }).click();
    await dialogo.getByLabel('Print ou vídeo').setInputFiles('test-files/gameplay.mp4');
    await expect(dialogo.getByLabel('Pré-visualização do vídeo escolhido')).toHaveAttribute('src', /^blob:/);
    await dialogo.getByLabel('Título').fill(tituloVideo);
    await dialogo.getByRole('button', { name: 'Postar' }).click();
    const video = galeria.getByLabel(`Vídeo: ${tituloVideo}`);
    await expect(video).toHaveAttribute('src', /^\/uploads\/midias\/[0-9a-f-]{36}\.mp4$/);

    // Persistência e exclusão
    await page.reload();
    await expect(galeria.getByRole('img', { name: `Print: ${tituloPrint}` })).toBeVisible();
    page.once('dialog', (confirmacao) => confirmacao.accept());
    await galeria.getByRole('button', { name: `Excluir gameplay ${tituloPrint}` }).click();
    await expect(page.getByText('Gameplay excluído')).toBeVisible();
    await expect(galeria.getByRole('img', { name: `Print: ${tituloPrint}` })).toHaveCount(0);
    await expect(video).toBeVisible();
  });

  test('gameplay: tipo inválido e envio sem arquivo mostram o erro ao usuário', async ({ page }) => {
    await abrirPerfilLogado(page);
    await page.getByRole('button', { name: 'Postar gameplay' }).click();
    const dialogo = page.getByRole('dialog', { name: 'POSTAR GAMEPLAY' });

    await dialogo.getByRole('button', { name: 'Postar' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('Escolha um print ou vídeo');

    await dialogo.getByLabel('Print ou vídeo').setInputFiles({ name: 'documento.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await expect(dialogo.getByRole('alert')).toContainText('Tipo de arquivo não permitido');
  });

  test('título curto é recusado pelo servidor e o erro por campo aparece no formulário', async ({ page }) => {
    await abrirPerfilLogado(page);
    await page.getByRole('button', { name: 'Postar gameplay' }).click();
    const dialogo = page.getByRole('dialog', { name: 'POSTAR GAMEPLAY' });
    await dialogo.getByLabel('Print ou vídeo').setInputFiles('test-files/print.jpg');
    await dialogo.getByLabel('Título').fill('ab');
    await dialogo.getByRole('button', { name: 'Postar' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('titulo deve ter no mínimo 3 caracteres');
  });

  test('resposta antiga e lenta da carga inicial não sobrescreve a galeria já atualizada (corrida)', async ({ page }) => {
    const usuario = novoUsuario();
    await cadastrarPelaApi(page, usuario);
    await entrarPelaInterface(page, usuario);

    // Só a PRIMEIRA resposta de GET /midias (carga inicial da página) chega atrasada ao navegador
    let primeira = true;
    await page.route('**/api/midias?usuario_id=*', async (route) => {
      if (!primeira) return route.continue();
      primeira = false;
      const resposta = await route.fetch(); // o servidor responde logo, com a galeria ainda vazia...
      await new Promise((resolve) => setTimeout(resolve, 2000)); // ...mas a resposta demora a chegar
      return route.fulfill({ response: resposta });
    });

    await page.goto('/pages/perfil.html');
    await page.getByRole('button', { name: 'Postar gameplay' }).click();
    const dialogo = page.getByRole('dialog', { name: 'POSTAR GAMEPLAY' });
    await dialogo.getByLabel('Print ou vídeo').setInputFiles('test-files/print.jpg');
    await dialogo.getByLabel('Título').fill(`Print ${usuario.nome}`);
    await dialogo.getByRole('button', { name: 'Postar' }).click();

    const galeria = page.getByRole('region', { name: 'Meus Gameplays' });
    const print = galeria.getByRole('img', { name: `Print: Print ${usuario.nome}` });
    await expect(print).toBeVisible();
    // Depois que a resposta atrasada chega, a galeria atualizada continua na tela
    await page.waitForTimeout(2500);
    await expect(print).toBeVisible();
  });
});
