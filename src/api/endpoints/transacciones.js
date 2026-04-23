import api from '../axios.js'

export const transaccionesApi = {
  getTransacciones: (params) => api.get('/transacciones', { params }),
  createTransaccion: (data) => api.post('/transacciones', data),
  getTransaccion: (id) => api.get(`/transacciones/${id}`),
  updateTransaccion: (id, data) => api.put(`/transacciones/${id}`, data),
  deleteTransaccion: (id) => api.delete(`/transacciones/${id}`),
}
