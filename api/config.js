const { del } = require('@vercel/blob');
const { sql } = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');
const { isBlobUrl } = require('./_lib/blob');
const { send, methodNotAllowed, serverError, readJson } = require('./_lib/http');

async function loadConfig() {
  const db = sql();
  const rows = await db`SELECT * FROM couple_config ORDER BY id LIMIT 1`;
  if (!rows.length) return null;
  const config = rows[0];
  const photos = await db`
    SELECT p.id, p.public_url AS url, COALESCE(p.caption, '') AS caption, cp.display_order
    FROM couple_photos cp JOIN photos p ON p.id = cp.photo_id
    WHERE cp.couple_config_id = ${config.id}
    ORDER BY cp.display_order, p.id`;
  return { ...config, photos };
}

// Valida e filtra os campos aceitos (nada além disso chega ao banco).
function parseInput(body) {
  const out = {};
  if ('couple_name' in body) {
    if (typeof body.couple_name !== 'string' || body.couple_name.length > 100) return { error: 'Nome do casal inválido' };
    out.couple_name = body.couple_name.trim();
  }
  if ('custom_phrase' in body) {
    if (typeof body.custom_phrase !== 'string' || body.custom_phrase.length > 500) return { error: 'Frase inválida' };
    out.custom_phrase = body.custom_phrase.trim();
  }
  if ('relationship_start' in body) {
    if (body.relationship_start === '' || body.relationship_start === null) {
      out.relationship_start = null;
    } else {
      const d = new Date(body.relationship_start);
      if (typeof body.relationship_start !== 'string' || isNaN(d.getTime())) return { error: 'Data inválida' };
      out.relationship_start = d.toISOString();
    }
  }
  if ('background_music_url' in body) {
    const url = body.background_music_url;
    if (url && (typeof url !== 'string' || !isBlobUrl(url))) return { error: 'URL da música inválida' };
    out.background_music_url = url || null;
  }
  return { data: out };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const config = await loadConfig();
      return send(res, 200, config, { 'Cache-Control': 'no-store' });
    }

    if (req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;
      const body = await readJson(req);
      if (!body || typeof body !== 'object') return send(res, 400, { message: 'Corpo inválido' });

      const { data, error } = parseInput(body);
      if (error) return send(res, 400, { message: error });

      const db = sql();
      const existing = await db`SELECT * FROM couple_config ORDER BY id LIMIT 1`;
      const cur = existing[0] || {};
      const next = {
        couple_name: 'couple_name' in data ? data.couple_name : cur.couple_name ?? null,
        custom_phrase: 'custom_phrase' in data ? data.custom_phrase : cur.custom_phrase ?? null,
        relationship_start: 'relationship_start' in data ? data.relationship_start : cur.relationship_start ?? null,
        background_music_url: 'background_music_url' in data ? data.background_music_url : cur.background_music_url ?? null,
      };

      if (!existing.length) {
        await db`
          INSERT INTO couple_config (couple_name, relationship_start, background_music_url, custom_phrase)
          VALUES (${next.couple_name}, ${next.relationship_start}, ${next.background_music_url}, ${next.custom_phrase})`;
      } else {
        await db`
          UPDATE couple_config SET
            couple_name = ${next.couple_name},
            custom_phrase = ${next.custom_phrase},
            relationship_start = ${next.relationship_start},
            background_music_url = ${next.background_music_url}
          WHERE id = ${cur.id}`;
      }

      // Música substituída ou removida: apaga o arquivo antigo do storage (best-effort)
      if (cur.background_music_url && cur.background_music_url !== next.background_music_url) {
        try { await del(cur.background_music_url); } catch (e) { console.error('Falha ao apagar música antiga:', e); }
      }
      return send(res, 200, await loadConfig());
    }

    return methodNotAllowed(res, ['GET', 'PUT']);
  } catch (error) {
    return serverError(res, error);
  }
};
