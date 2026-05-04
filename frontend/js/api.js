const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data;
}

const api = {
  get:    (path)       => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
};

function saveSession(token, nome, perfil) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ nome, perfil }));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function isLoggedIn() { return !!getToken(); }

function setupNav() {
  const user = getUser();
  document.querySelectorAll('.guest-only').forEach(el =>
    el.style.display = user ? 'none' : ''
  );
  document.querySelectorAll('.auth-only').forEach(el =>
    el.style.display = user ? 'inline-flex' : 'none'
  );
  const nomeEl = document.querySelector('.nav-username');
  if (nomeEl && user) nomeEl.textContent = user.nome;
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
