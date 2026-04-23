import api from '../axios.js'

export const cuentasApi = {
  getCuentas: () => api.get('/cuentas'),
  createCuenta: (data) => api.post('/cuentas', data),
  getCuenta: (id) => api.get(`/cuentas/${id}`),
  updateCuenta: (id, data) => api.put(`/cuentas/${id}`, data),
  deleteCuenta: (id) => api.delete(`/cuentas/${id}`),
}
