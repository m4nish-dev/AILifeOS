import api from './api.js';

export const authService = {
  async register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.success) {
      localStorage.setItem('ailifeos-token', data.data.token);
      localStorage.setItem('ailifeos-user', JSON.stringify(data.data.user));
    }
    return data;
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('ailifeos-token', data.data.token);
      localStorage.setItem('ailifeos-user', JSON.stringify(data.data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('ailifeos-token');
    localStorage.removeItem('ailifeos-user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('ailifeos-user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('ailifeos-token'));
  },
};

export default authService;
