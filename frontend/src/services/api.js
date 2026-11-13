import axios from 'axios';

export const TOKEN_KEY = 'blog_token';

// Every request goes to /api/... (Vite forwards it to the backend).
const api = axios.create({ baseURL: '/api' });

// Attach the login token (the "ID card") to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says our token is no longer valid, forget it and tell the app.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(err);
  }
);

export default api;
