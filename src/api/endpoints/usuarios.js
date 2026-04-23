import api from '../axios.js'

export const usuariosApi = {
  getMe: () => api.get('/usuarios/me'),
  updateMe: (data) => api.put('/usuarios/me', data),
}
