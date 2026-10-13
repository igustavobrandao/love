// src/integrations/Core.js
import { upload } from '@vercel/blob/client';

/**
 * Envia um arquivo direto do navegador para o Vercel Blob.
 * O token de upload só é emitido por /api/upload para o admin logado.
 * @param {File} file
 * @param {'photos'|'music'} folder
 */
export const UploadFile = async ({ file, folder }) => {
  if (!file) throw new Error('Nenhum arquivo informado.');
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const blob = await upload(`${folder}/${safeName}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType: file.type,
  });
  return {
    file_url: blob.url,
    pathname: blob.pathname,
    mime_type: file.type,
    size_bytes: file.size,
  };
};
