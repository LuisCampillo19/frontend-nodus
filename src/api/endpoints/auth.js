import api from '../axios.js'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
  logout: (refresh_token) => api.post('/auth/logout', { refresh_token }),
}
