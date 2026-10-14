const { handleUpload } = require('@vercel/blob/client');
const { requireAdmin } = require('./_lib/auth');
const { send, methodNotAllowed, serverError, readJson } = require('./_lib/http');

const MB = 1024 * 1024;

// Cada tipo de upload tem seu próprio limite e conjunto de formatos.
const RULES = {
  photos: { types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], max: 10 * MB },
  music: { types: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'], max: 50 * MB },
};

// Endpoint que emite tokens de upload direto (navegador -> Vercel Blob).
// Os arquivos não passam pela função, então não há limite de 4,5MB da Vercel.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = await readJson(req);
    if (!body) return send(res, 400, { message: 'Corpo inválido' });

    // Só emitimos token de upload para o admin logado.
    if (body.type === 'blob.generate-client-token' && !requireAdmin(req, res)) return;

    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const rule = RULES[pathname.split('/')[0]];
        if (!rule) throw new Error('Pasta de upload não permitida');
        return {
          allowedContentTypes: rule.types,
          maximumSizeInBytes: rule.max,
          addRandomSuffix: true,
        };
      },
    });
    return send(res, 200, json);
  } catch (error) {
    console.error('Erro no upload:', error);
    return send(res, 400, { message: 'Não foi possível autorizar o upload' });
  }
};
