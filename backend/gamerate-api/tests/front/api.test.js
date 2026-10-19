import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Testes do módulo que fala com a API (public/js/api.js) sem navegador:
// JSDOM fornece o DOM, e `fetch` e `localStorage` são substituídos por dublês.

/** localStorage falso, em memória, com espiões nas operações. */
function criarStorage(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: vi.fn((k) => (dados.has(k) ? dados.get(k) : null)),
    setItem: vi.fn((k, v) => { dados.set(k, String(v)); }),
    removeItem: vi.fn((k) => { dados.delete(k); }),
    dados,
  };
}

/** Resposta falsa de fetch. `corpo` undefined simula corpo que não é JSON. */
function resposta(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: corpo === undefined ? vi.fn().mockRejectedValue(new SyntaxError('sem json')) : vi.fn().mockResolvedValue(corpo),
  };
}

let storage;
let fetchFalso;
let m; // funções exportadas por api.js

async function carregar() {
  vi.resetModules();
  globalThis.__GAMERATE_EXPORTS__ = {};
  await import('../../public/js/api.js');
  return globalThis.__GAMERATE_EXPORTS__;
}

beforeEach(async () => {
  storage = criarStorage();
  fetchFalso = vi.fn();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('fetch', fetchFalso);
  document.body.innerHTML = '';
  m = await carregar();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete globalThis.__GAMERATE_EXPORTS__;
});

describe('sessão (localStorage)', () => {
  it('saveSession guarda o token e os dados do usuário em chaves separadas', () => {
    m.saveSession('jwt-123', 'Davi', 'Jogador', 7, '/uploads/avatars/a.png');
    expect(storage.setItem).toHaveBeenCalledWith('token', 'jwt-123');
    expect(JSON.parse(storage.dados.get('user'))).toEqual({ id: 7, nome: 'Davi', perfil: 'Jogador', imagem: '/uploads/avatars/a.png' });
  });

  it('saveSession sem foto grava imagem nula', () => {
    m.saveSession('t', 'Ana', 'Jogador', 1);
    expect(JSON.parse(storage.dados.get('user')).imagem).toBeNull();
  });

  it('getToken e getUser leem o que foi salvo', () => {
    m.saveSession('t', 'Ana', 'Jogador', 1);
    expect(m.getToken()).toBe('t');
    expect(m.getUser()).toMatchObject({ id: 1, nome: 'Ana' });
  });

  it('getUser devolve null quando não há usuário ou o JSON está corrompido (borda)', () => {
    expect(m.getUser()).toBeNull();
    storage.dados.set('user', '{quebrado');
    expect(m.getUser()).toBeNull();
  });

  it('isLoggedIn exige token E usuário', () => {
    expect(m.isLoggedIn()).toBe(false);
    storage.dados.set('token', 't');
    expect(m.isLoggedIn()).toBe(false);
    storage.dados.set('user', JSON.stringify({ id: 1 }));
    expect(m.isLoggedIn()).toBe(true);
  });

  it('clearSession remove token e usuário', () => {
    m.saveSession('t', 'Ana', 'Jogador', 1);
    m.clearSession();
    expect(storage.removeItem).toHaveBeenCalledWith('token');
    expect(storage.removeItem).toHaveBeenCalledWith('user');
    expect(m.isLoggedIn()).toBe(false);
  });

  it('setSessionImagem atualiza só a foto; null remove; sem usuário não faz nada', () => {
    m.setSessionImagem('/x.png');
    expect(storage.dados.has('user')).toBe(false);
    m.saveSession('t', 'Ana', 'Jogador', 1);
    m.setSessionImagem('/uploads/avatars/nova.png');
    expect(m.getUser()).toMatchObject({ nome: 'Ana', imagem: '/uploads/avatars/nova.png' });
    m.setSessionImagem(undefined);
    expect(m.getUser().imagem).toBeNull();
  });
});

describe('apiFetch / api: requisições', () => {
  it('GET usa o prefixo /api e envia JSON; sem token não envia Authorization', async () => {
    fetchFalso.mockResolvedValue(resposta(200, { ok: true }));
    const dados = await m.api.get('/jogos');
    expect(dados).toEqual({ ok: true });
    const [url, opcoes] = fetchFalso.mock.calls[0];
    expect(url).toBe('/api/jogos');
    expect(opcoes.headers['Content-Type']).toBe('application/json');
    expect(opcoes.headers).not.toHaveProperty('Authorization');
    expect(opcoes.method).toBeUndefined();
  });

  it('com token salvo, envia Authorization: Bearer <token>', async () => {
    m.saveSession('meu-token', 'Ana', 'Jogador', 1);
    fetchFalso.mockResolvedValue(resposta(200, {}));
    await m.api.get('/auth/me');
    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBe('Bearer meu-token');
  });

  it('POST serializa o corpo em JSON e usa o método POST', async () => {
    fetchFalso.mockResolvedValue(resposta(201, { id: 1 }));
    await m.api.post('/avaliacoes', { nota: 5, titulo: 'Ótimo' });
    const [url, opcoes] = fetchFalso.mock.calls[0];
    expect(url).toBe('/api/avaliacoes');
    expect(opcoes.method).toBe('POST');
    expect(JSON.parse(opcoes.body)).toEqual({ nota: 5, titulo: 'Ótimo' });
  });

  it('PUT e DELETE usam o método correto', async () => {
    fetchFalso.mockResolvedValue(resposta(200, {}));
    await m.api.put('/usuarios/3', { nome_usuario: 'Novo' });
    await m.api.delete('/avaliacoes/9');
    expect(fetchFalso.mock.calls[0][1].method).toBe('PUT');
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toEqual({ nome_usuario: 'Novo' });
    expect(fetchFalso.mock.calls[1][0]).toBe('/api/avaliacoes/9');
    expect(fetchFalso.mock.calls[1][1].method).toBe('DELETE');
  });

  it('upload com FormData NÃO define Content-Type (o navegador gera o boundary) e mantém o token', async () => {
    m.saveSession('tok', 'Ana', 'Jogador', 1);
    fetchFalso.mockResolvedValue(resposta(201, { caminho: '/uploads/avatars/x.png' }));
    const form = new FormData();
    form.append('imagem', new Blob(['x'], { type: 'image/png' }), 'a.png');

    const dados = await m.api.upload('POST', '/usuarios/imagem', form);

    const [url, opcoes] = fetchFalso.mock.calls[0];
    expect(dados.caminho).toBe('/uploads/avatars/x.png');
    expect(url).toBe('/api/usuarios/imagem');
    expect(opcoes.method).toBe('POST');
    expect(opcoes.body).toBe(form);
    expect(opcoes.headers).not.toHaveProperty('Content-Type');
    expect(opcoes.headers.Authorization).toBe('Bearer tok');
  });

  it('cabeçalhos passados em options sobrescrevem os padrões', async () => {
    fetchFalso.mockResolvedValue(resposta(200, {}));
    await m.apiFetch('/x', { headers: { 'X-Teste': '1', 'Content-Type': 'text/plain' } });
    const { headers } = fetchFalso.mock.calls[0][1];
    expect(headers['X-Teste']).toBe('1');
    expect(headers['Content-Type']).toBe('text/plain');
  });

  it('resposta 204 sem corpo JSON devolve objeto vazio', async () => {
    fetchFalso.mockResolvedValue(resposta(204, undefined));
    await expect(m.api.delete('/avaliacoes/1')).resolves.toEqual({});
  });
});

describe('apiFetch: respostas de erro', () => {
  it('lança Error com a mensagem do servidor, o status e as issues por campo', async () => {
    const issues = [{ path: 'email', message: 'email deve ter um formato válido' }];
    fetchFalso.mockResolvedValue(resposta(400, { error: 'Dados inválidos na requisição', issues }));
    const erro = await m.api.post('/auth/cadastro', {}).catch((e) => e);
    expect(erro).toBeInstanceOf(Error);
    expect(erro.message).toBe('Dados inválidos na requisição');
    expect(erro.status).toBe(400);
    expect(erro.issues).toEqual(issues);
  });

  it('sem mensagem no corpo usa "Erro <status>" e issues vazia', async () => {
    fetchFalso.mockResolvedValue(resposta(500, undefined));
    const erro = await m.api.get('/x').catch((e) => e);
    expect(erro.message).toBe('Erro 500');
    expect(erro.issues).toEqual([]);
  });

  it('401 com token salvo limpa a sessão local (sessão expirada)', async () => {
    m.saveSession('expirado', 'Ana', 'Jogador', 1);
    fetchFalso.mockResolvedValue(resposta(401, { error: 'Sessão inválida ou expirada. Faça login novamente.' }));
    const erro = await m.api.get('/auth/me').catch((e) => e);
    expect(erro.status).toBe(401);
    expect(m.getToken()).toBeNull();
    expect(m.getUser()).toBeNull();
  });

  it('401 sem token (ex.: login errado) não mexe no localStorage', async () => {
    fetchFalso.mockResolvedValue(resposta(401, { error: 'Credenciais inválidas' }));
    await expect(m.api.post('/auth/login', {})).rejects.toThrow('Credenciais inválidas');
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('403 e 404 mantêm a sessão e propagam o status', async () => {
    m.saveSession('t', 'Ana', 'Jogador', 1);
    fetchFalso.mockResolvedValueOnce(resposta(403, { error: 'sem permissão' }));
    fetchFalso.mockResolvedValueOnce(resposta(404, { error: 'não encontrado' }));
    expect((await m.api.get('/a').catch((e) => e)).status).toBe(403);
    expect((await m.api.get('/b').catch((e) => e)).status).toBe(404);
    expect(m.isLoggedIn()).toBe(true);
  });

  it('falha de rede (fetch rejeita) é propagada ao chamador', async () => {
    fetchFalso.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(m.api.get('/jogos')).rejects.toThrow('Failed to fetch');
  });
});

describe('setupNav / logout', () => {
  const montarNav = () => {
    document.body.innerHTML = `
      <nav>
        <a class="guest-only" href="/pages/login.html">Login</a>
        <a class="auth-only" href="/pages/perfil.html"><span class="nav-username"></span></a>
        <a class="auth-only" href="#">Sair</a>
      </nav>`;
  };

  it('visitante: mostra links de guest e esconde os de usuário logado', () => {
    montarNav();
    m.setupNav();
    expect(document.querySelector('.guest-only').style.display).toBe('');
    expect(document.querySelector('.auth-only').style.display).toBe('none');
    expect(document.querySelector('.avatar')).toBeNull();
  });

  it('logado: mostra o nome e o avatar com iniciais, esconde o login', () => {
    m.saveSession('t', 'Davi', 'Jogador', 1);
    montarNav();
    m.setupNav();
    expect(document.querySelector('.guest-only').style.display).toBe('none');
    expect(document.querySelector('.auth-only').style.display).toBe('inline-flex');
    expect(document.querySelector('.nav-username').textContent).toBe('Davi');
    expect(document.querySelector('.avatar-fallback').textContent).toBe('DA');
  });

  it('logado com foto: o avatar do cabeçalho usa a imagem enviada', () => {
    m.saveSession('t', 'Davi', 'Jogador', 1, '/uploads/avatars/foto.png');
    montarNav();
    m.setupNav();
    expect(document.querySelector('img.avatar').getAttribute('src')).toBe('/uploads/avatars/foto.png');
  });

  it('chamar setupNav de novo não duplica o avatar', () => {
    m.saveSession('t', 'Davi', 'Jogador', 1);
    montarNav();
    m.setupNav();
    m.setupNav();
    expect(document.querySelectorAll('.avatar')).toHaveLength(1);
  });

  it('logout limpa a sessão e redireciona para a tela de login', () => {
    m.saveSession('t', 'Davi', 'Jogador', 1);
    // location substituído por um dublê: jsdom não implementa navegação real.
    const location = { href: '/pages/perfil.html' };
    vi.stubGlobal('location', location);
    m.logout();
    expect(m.isLoggedIn()).toBe(false);
    expect(location.href).toBe('/pages/login.html');
  });
});

describe('toast', () => {
  it('aparece com a classe do tipo, fica visível e some depois de 3 s', () => {
    vi.useFakeTimers();
    m.toast('Salvo!', 'success');
    const el = document.querySelector('.toast');
    expect(el.textContent).toBe('Salvo!');
    expect(el.classList.contains('toast-success')).toBe(true);
    vi.advanceTimersByTime(10);
    expect(el.classList.contains('show')).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(el.classList.contains('show')).toBe(false);
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.toast')).toBeNull();
  });

  it('o tipo padrão é "info"', () => {
    m.toast('Olá');
    expect(document.querySelector('.toast').classList.contains('toast-info')).toBe(true);
  });
});

describe('formatação e avatares', () => {
  it('fmtDate formata em pt-BR com dia, mês abreviado e ano', () => {
    expect(m.fmtDate('2026-10-05T12:00:00')).toMatch(/05.*out.*2026/i);
  });

  it('escapeHtml escapa os cinco caracteres perigosos e aceita vazio/ausente', () => {
    expect(m.escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    expect(m.escapeHtml()).toBe('');
    expect(m.escapeHtml(42)).toBe('42');
  });

  it('avatarCor é determinístico e sempre devolve uma cor da paleta', () => {
    expect(m.avatarCor('Davi')).toBe(m.avatarCor('Davi'));
    expect(m.avatarCor('Davi')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.avatarCor()).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('avatarHtml sem foto gera círculo com as iniciais em maiúsculas', () => {
    const el = document.createElement('div');
    el.innerHTML = m.avatarHtml('maria', null, 40);
    const span = el.querySelector('span.avatar-fallback');
    expect(span.textContent).toBe('MA');
    expect(span.style.width).toBe('40px');
    expect(span.style.fontSize).toBe('16px');
  });

  it('avatarHtml com nome vazio usa "?"', () => {
    const el = document.createElement('div');
    el.innerHTML = m.avatarHtml('', null);
    expect(el.textContent).toBe('?');
  });

  it('avatarHtml com foto gera <img> com src e alt, e escapa nomes maliciosos (XSS)', () => {
    const el = document.createElement('div');
    el.innerHTML = m.avatarHtml('<img src=x onerror=alert(1)>', '/uploads/avatars/a.png', 36);
    const img = el.querySelector('img.avatar');
    expect(img.getAttribute('src')).toBe('/uploads/avatars/a.png');
    expect(img.getAttribute('alt')).toContain('<img src=x');
    expect(el.querySelectorAll('img')).toHaveLength(1);
  });

  it('se a imagem falhar ao carregar, o avatar volta para as iniciais', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.innerHTML = m.avatarHtml('Davi', '/uploads/avatars/removida.png', 36);
    const img = el.querySelector('img');
    img.dispatchEvent(new Event('error'));
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.avatar-fallback').textContent).toBe('DA');
  });
});
