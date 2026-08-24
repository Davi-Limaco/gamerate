const API_BASE = '/api';
const TOKEN_STORAGE_KEY = 'gamerate_token';

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
}

function decodeJwtPayload(token) {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return null;
    return JSON.parse(decodeBase64Url(payloadPart));
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getUser() {
  const token = getToken();
  if (!token) {
    clearSession();
    return null;
  }

  const payload = decodeJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);

  if (!payload || !payload.userId || !payload.exp || payload.exp < now) {
    clearSession();
    return null;
  }

  return {
    id: payload.userId,
    nome: payload.nome || null,
    email: payload.email || null,
    perfil: payload.perfil || null,
  };
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (!path.startsWith('/auth/') && !location.pathname.endsWith('/login.html')) {
        window.location.replace('/pages/login.html');
      }
    }
    throw new Error(data.error || data.message || `Erro ${res.status}`);
  }

  return data;
}

const api = {
  get:    (path)       => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
};

function saveSession(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function isLoggedIn() { return !!getUser(); }

function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.replace('/pages/login.html');
    return null;
  }
  return user;
}

function setupNav() {
  const user = getUser();
  document.querySelectorAll('.guest-only').forEach(el =>
    el.style.display = user ? 'none' : ''
  );
  document.querySelectorAll('.auth-only').forEach(el =>
    el.style.display = user ? 'inline-flex' : 'none'
  );
  const nomeEl = document.querySelector('.nav-username');
  if (nomeEl && user) nomeEl.textContent = user.nome || 'Perfil';
}

function logout() {
  clearSession();
  window.location.href = '/pages/login.html';
}

function toast(msg, tipo = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
}
