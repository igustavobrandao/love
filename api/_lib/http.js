function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

function methodNotAllowed(res, allowed) {
  send(res, 405, { message: 'Método não permitido' }, { Allow: allowed.join(', ') });
}

// Erros internos não vazam detalhes para o cliente.
function serverError(res, error) {
  console.error('Erro na API:', error);
  send(res, 500, { message: 'Erro interno do servidor' });
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (fwd ? String(fwd).split(',')[0] : req.socket?.remoteAddress || 'unknown').trim();
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

module.exports = { send, methodNotAllowed, serverError, clientIp, readJson };
