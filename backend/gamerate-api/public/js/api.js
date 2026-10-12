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
  // Em upload (corpo FormData) o Content-Type NÃO pode ser definido à mão: o
  // navegador precisa gerar "multipart/form-data; boundary=..." sozinho, com o
  // boundary correto. Só para JSON o cabeçalho é fixado aqui.
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
  // Upload multipart: recebe um FormData pronto (ex.: com o campo "imagem").
  upload: (method, path, formData) => apiFetch(path, { method, body: formData }),
};

// Chamada após login/cadastro bem-sucedidos: guarda o JWT (usado em toda
// requisição futura) e os dados do usuário exibidos na interface (nome,
// perfil, id) separadamente — a UI nunca decide "quem é o usuário" a partir
// do token em si, só o back-end faz essa verificação criptográfica.
function saveSession(token, nome, perfil, id, imagem = null) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ id, nome, perfil, imagem }));
}
// Atualiza só a foto guardada na sessão (após enviar/remover o avatar), para o
// cabeçalho de todas as páginas refletir a mudança sem novo login.
function setSessionImagem(imagem) {
  const user = getUser();
  if (user) localStorage.setItem('user', JSON.stringify({ ...user, imagem: imagem || null }));
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
  if (nomeEl && user) {
    nomeEl.textContent = user.nome;
    // Avatar no cabeçalho (foto enviada ou iniciais), antes do nome.
    nomeEl.parentElement.querySelector('.avatar')?.remove();
    nomeEl.insertAdjacentHTML('beforebegin', avatarHtml(user.nome, user.imagem, 26));
  }
}

const AVATAR_CORES = ['#e8ff47', '#47c8ff', '#ff8c47', '#c847ff', '#47ffb0', '#ff4f8b'];
function avatarCor(nome = '') {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_CORES[h % AVATAR_CORES.length];
}
function escapeHtml(v = '') {
  return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Avatar reutilizável em qualquer tela: se o usuário tem foto, mostra a imagem
// servida em /uploads/...; senão, um círculo colorido com as iniciais. Se a
// imagem falhar ao carregar (arquivo removido), cai para as iniciais.
function avatarHtml(nome, imagem, size = 36) {
  const iniciais = escapeHtml((nome || '?').slice(0, 2).toUpperCase());
  const base = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px`;
  const fallback = `<span class="avatar avatar-fallback" style="${base};background:${avatarCor(nome)}">${iniciais}</span>`;
  if (!imagem) return fallback;
  return `<img class="avatar" style="${base}" src="${escapeHtml(imagem)}" alt="Foto de ${escapeHtml(nome)}"
    onerror="this.outerHTML=this.dataset.fb" data-fb="${escapeHtml(fallback)}">`;
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
