const { sql } = require('./_lib/db');
const auth = require('./_lib/auth');
const { send, methodNotAllowed, serverError, clientIp, readJson } = require('./_lib/http');

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

// Limite de tentativas por IP, guardado no banco (a função serverless não tem memória fixa).
async function isBlocked(ip) {
  const rows = await sql()`
    SELECT attempts FROM login_attempts
    WHERE ip = ${ip} AND window_start > now() - make_interval(mins => ${WINDOW_MINUTES})`;
  return rows.length > 0 && rows[0].attempts >= MAX_ATTEMPTS;
}

async function registerFailure(ip) {
  await sql()`
    INSERT INTO login_attempts (ip, attempts, window_start) VALUES (${ip}, 1, now())
    ON CONFLICT (ip) DO UPDATE SET
      attempts = CASE WHEN login_attempts.window_start > now() - make_interval(mins => ${WINDOW_MINUTES})
                      THEN login_attempts.attempts + 1 ELSE 1 END,
      window_start = CASE WHEN login_attempts.window_start > now() - make_interval(mins => ${WINDOW_MINUTES})
                          THEN login_attempts.window_start ELSE now() END`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      return send(res, 200, { authenticated: auth.isAuthenticated(req) });
    }

    if (req.method === 'POST') {
      if (!auth.sameOrigin(req)) return send(res, 403, { message: 'Origem não permitida' });
      const ip = clientIp(req);

      if (await isBlocked(ip)) {
        return send(res, 429, { message: 'Muitas tentativas. Tente novamente em alguns minutos.' });
      }

      const body = await readJson(req);
      if (!body || typeof body.password !== 'string' || !auth.checkPassword(body.password)) {
        await registerFailure(ip);
        return send(res, 401, { message: 'Senha incorreta' });
      }

      await sql()`DELETE FROM login_attempts WHERE ip = ${ip}`;
      return send(res, 200, { authenticated: true }, {
        'Set-Cookie': auth.sessionCookie(auth.createSessionToken()),
        'Cache-Control': 'no-store',
      });
    }

    if (req.method === 'DELETE') {
      return send(res, 200, { authenticated: false }, { 'Set-Cookie': auth.clearCookie() });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
  } catch (error) {
    return serverError(res, error);
  }
};
