const crypto = require('crypto');
const { send } = require('./http');

const COOKIE_NAME = 'love_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres)');
  }
  return s;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  // Compara hashes de tamanho fixo para não vazar tamanho nem tempo
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD não configurada');
  return safeEqual(candidate || '', expected);
}

function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function isAuthenticated(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.role === 'admin' && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function cookieAttrs(maxAge) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; ${cookieAttrs(SESSION_TTL_SECONDS)}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; ${cookieAttrs(0)}`;
}

// Defesa extra contra CSRF: em requisições que alteram dados, o Origin
// (quando enviado pelo navegador) precisa ser o mesmo host do site.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

// Exige admin autenticado. Retorna true se pode continuar; senão já respondeu.
function requireAdmin(req, res) {
  if (!sameOrigin(req)) {
    send(res, 403, { message: 'Origem não permitida' });
    return false;
  }
  if (!isAuthenticated(req)) {
    send(res, 401, { message: 'Não autenticado' });
    return false;
  }
  return true;
}

module.exports = {
  checkPassword, createSessionToken, isAuthenticated, requireAdmin,
  sessionCookie, clearCookie, sameOrigin,
};
