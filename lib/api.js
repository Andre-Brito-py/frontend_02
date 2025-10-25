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
    if (typeof window !== 'undefined' && status === 401) {
      try { localStorage.removeItem('token'); } catch {}
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;