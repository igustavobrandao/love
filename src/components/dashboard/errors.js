// Traduz erros técnicos (Vercel Blob, rede, API) em mensagens que a pessoa entende.
export function friendlyError(error) {
  const message = error?.message || '';
  if (error?.status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (/client token|authorize|autorizar/i.test(message)) {
    return 'Não foi possível autorizar o envio. Entre novamente e tente de novo.';
  }
  if (/failed to fetch|network|load failed|abort/i.test(message)) {
    return 'Falha de conexão. Verifique a internet e tente de novo.';
  }
  return message || 'Erro inesperado. Tente novamente.';
}

// Nome amigável a partir da URL do Blob (tira a pasta e o sufixo aleatório que o Blob adiciona).
export function nameFromUrl(url) {
  try {
    const file = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    return file.replace(/-[A-Za-z0-9]{20,}(\.[A-Za-z0-9]+)$/, '$1');
  } catch {
    return 'Música de fundo';
  }
}
