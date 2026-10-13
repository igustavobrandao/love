const { del } = require('@vercel/blob');
const { sql } = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');
const { isBlobUrl } = require('./_lib/blob');
const { send, methodNotAllowed, serverError, readJson } = require('./_lib/http');

function parseId(req) {
  const id = Number(new URL(req.url, 'http://x').searchParams.get('id'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = async function handler(req, res) {
  try {
    const db = sql();

    if (req.method === 'GET') {
      const rows = await db`
        SELECT p.id, p.public_url AS url, COALESCE(p.caption, '') AS caption, cp.display_order
        FROM couple_photos cp JOIN photos p ON p.id = cp.photo_id
        ORDER BY cp.display_order, p.id`;
      return send(res, 200, rows, { 'Cache-Control': 'no-store' });
    }

    if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
    }
    if (!requireAdmin(req, res)) return;

    // Registra uma foto que o navegador já enviou direto ao Vercel Blob
    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body || !isBlobUrl(body.url) || typeof body.pathname !== 'string') {
        return send(res, 400, { message: 'Dados da foto inválidos' });
      }
      const size = Number.isInteger(body.size_bytes) ? body.size_bytes : null;
      const mime = typeof body.mime_type === 'string' ? body.mime_type.slice(0, 100) : null;

      let config = (await db`SELECT id FROM couple_config ORDER BY id LIMIT 1`)[0];
      if (!config) config = (await db`INSERT INTO couple_config DEFAULT VALUES RETURNING id`)[0];

      const [photo] = await db`
        INSERT INTO photos (file_path, public_url, mime_type, size_bytes)
        VALUES (${body.pathname.slice(0, 500)}, ${body.url}, ${mime}, ${size})
        RETURNING id, public_url AS url, COALESCE(caption, '') AS caption`;
      const [{ next }] = await db`
        SELECT COALESCE(MAX(display_order) + 1, 0) AS next FROM couple_photos WHERE couple_config_id = ${config.id}`;
      await db`
        INSERT INTO couple_photos (couple_config_id, photo_id, display_order)
        VALUES (${config.id}, ${photo.id}, ${next})`;
      return send(res, 201, { ...photo, display_order: next });
    }

    const id = parseId(req);
    if (!id) return send(res, 400, { message: 'ID da foto inválido' });

    if (req.method === 'PATCH') {
      const body = await readJson(req);
      if (!body || typeof body.caption !== 'string' || body.caption.length > 300) {
        return send(res, 400, { message: 'Legenda inválida' });
      }
      const rows = await db`
        UPDATE photos SET caption = ${body.caption.trim()} WHERE id = ${id}
        RETURNING id, public_url AS url, COALESCE(caption, '') AS caption`;
      if (!rows.length) return send(res, 404, { message: 'Foto não encontrada' });
      return send(res, 200, rows[0]);
    }

    // DELETE: remove do banco e do storage
    const rows = await db`DELETE FROM photos WHERE id = ${id} RETURNING public_url`;
    if (!rows.length) return send(res, 404, { message: 'Foto não encontrada' });
    try { await del(rows[0].public_url); } catch (e) { console.error('Falha ao apagar arquivo do storage:', e); }
    return send(res, 200, { success: true });
  } catch (error) {
    return serverError(res, error);
  }
};
