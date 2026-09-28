const API_BASE = '/api';

function getUser()  {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

// O JWT de sessão é guardado separado do resto dos dados do usuário — é ele
// (não o objeto "user") que autentica cada requisição subsequente à API.
function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(path, options = {}) {
  const token   = getToken();
  const headers = {
    'Content-Type': 'application/json',
    // Envia o token salvo no login/cadastro em toda requisição, no formato
    // exigido pelo middleware `authenticate` do back-end: "Bearer <token>".
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res  = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sessão inválida/expirada (token ausente, adulterado ou vencido): o
    // back-end já rejeitou com 401 antes de tocar em qualquer dado protegido.
    // Limpa a sessão local para a UI voltar a refletir "não autenticado" em
    // vez de continuar mostrando um usuário que a API não reconhece mais.
    if (res.status === 401 && token) {
      clearSession();
    }
    // Além da mensagem, expõe o status HTTP (400/401/403/404/409...) e,
    // quando o middleware de validação retornou issues por campo, a lista
    // completa — permite que cada página mapeie o erro para o input
    // correspondente.
    const error = new Error(data.error || `Erro ${res.status}`);
    error.status = res.status;
    error.issues = data.issues || [];
    throw error;
  }
  return data;
}

const api = {
  get:    (path)       => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
};

// Chamada após login/cadastro bem-sucedidos: guarda o JWT (usado em toda
// requisição futura) e os dados do usuário exibidos na interface (nome,
// perfil, id) separadamente — a UI nunca decide "quem é o usuário" a partir
// do token em si, só o back-end faz essa verificação criptográfica.
function saveSession(token, nome, perfil, id) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ id, nome, perfil }));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function isLoggedIn() { return !!getToken() && !!getUser(); }

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
