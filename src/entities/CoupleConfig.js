// src/entities/CoupleConfig.js
// Camada de acesso às nossas APIs (/api/*). O navegador nunca fala direto com o banco.

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `Erro ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const Auth = {
  async status() {
    try {
      const data = await apiRequest('/api/auth');
      return !!data?.authenticated;
    } catch {
      return false;
    }
  },
  login(password) {
    return apiRequest('/api/auth', { method: 'POST', body: JSON.stringify({ password }) });
  },
  logout() {
    return apiRequest('/api/auth', { method: 'DELETE' });
  },
};

export const CoupleConfig = {
  // Configuração pública (usada na Home). Retorna null se ainda não existir.
  get() {
    return apiRequest('/api/config');
  },
  // Somente admin
  save(data) {
    return apiRequest('/api/config', { method: 'PUT', body: JSON.stringify(data) });
  },
};

export const Photos = {
  register(photo) {
    return apiRequest('/api/photos', { method: 'POST', body: JSON.stringify(photo) });
  },
  updateCaption(id, caption) {
    return apiRequest(`/api/photos?id=${id}`, { method: 'PATCH', body: JSON.stringify({ caption }) });
  },
  remove(id) {
    return apiRequest(`/api/photos?id=${id}`, { method: 'DELETE' });
  },
};
