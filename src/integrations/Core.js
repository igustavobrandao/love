// src/integrations/Core.js
import { upload } from '@vercel/blob/client';

const MB = 1024 * 1024;

// Mesmos formatos e limites aceitos por /api/upload (o servidor valida de novo)
export const FILE_RULES = {
  photos: {
    label: 'JPG, PNG, GIF ou WEBP',
    maxBytes: 10 * MB,
    mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  music: {
    label: 'MP3, WAV, OGG ou M4A',
    maxBytes: 50 * MB,
    mimes: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  },
};

const MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
};

// Alguns navegadores informam tipos diferentes para o mesmo formato (ex.: audio/mp3);
// a extensão é mais confiável.
export const detectMime = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  return MIME_BY_EXT[ext] || file.type;
};

export const formatBytes = (bytes) =>
  bytes >= MB ? `${(bytes / MB).toFixed(1).replace('.0', '')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Retorna a mensagem do problema, ou null se o arquivo é válido. */
export const validateFile = (file, folder) => {
  const rule = FILE_RULES[folder];
  if (!rule.mimes.includes(detectMime(file))) {
    return `Formato não suportado. Use ${rule.label}.`;
  }
  if (file.size > rule.maxBytes) {
    return `Arquivo muito grande (${formatBytes(file.size)}). O limite é ${formatBytes(rule.maxBytes)}.`;
  }
  if (file.size === 0) return 'O arquivo está vazio.';
  return null;
};

/**
 * Envia um arquivo direto do navegador para o Vercel Blob.
 * O token de upload só é emitido por /api/upload para o admin logado.
 * @param {{ file: File, folder: 'photos'|'music', onProgress?: (percentage: number) => void }} args
 */
export const UploadFile = async ({ file, folder, onProgress }) => {
  if (!file) throw new Error('Nenhum arquivo informado.');
  const mimeType = detectMime(file);
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const blob = await upload(`${folder}/${safeName}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType: mimeType,
    multipart: file.size > 8 * MB, // arquivos grandes: partes em paralelo, com retentativa
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
  });
  return {
    file_url: blob.url,
    pathname: blob.pathname,
    mime_type: mimeType,
    size_bytes: file.size,
  };
};
