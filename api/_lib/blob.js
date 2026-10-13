// Só aceitamos URLs que realmente pertencem ao Vercel Blob (evita registrar links arbitrários).
function isBlobUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

module.exports = { isBlobUrl };
