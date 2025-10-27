import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Trata 401 (token expirado ou ausente) de forma global
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    // Em dev, não redirecionar automaticamente em 401.
    // Deixe componentes decidirem (ex.: Protected).
    // Isso evita loops de logout quando um endpoint falha após login.
    if (typeof window !== 'undefined' && status === 401) {
      // Opcional: console.warn('Unauthorized API response', error?.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;