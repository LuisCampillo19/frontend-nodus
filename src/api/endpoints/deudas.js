import api from '../axios.js'

export const deudasApi = {
  getDeudas: (params) => api.get('/deudas', { params }),
  createDeuda: (data) => api.post('/deudas', data),
  getDeuda: (id) => api.get(`/deudas/${id}`),
  updateDeuda: (id, data) => api.put(`/deudas/${id}`, data),
  registrarPago: (id, data) => api.post(`/deudas/${id}/pagos`, data),
}
