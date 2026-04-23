import api from '../axios.js'

export const categoriasApi = {
  getCategorias: (tipo) => api.get('/categorias', { params: tipo ? { tipo } : {} }),
  createCategoria: (data) => api.post('/categorias', data),
  updateCategoria: (id, data) => api.put(`/categorias/${id}`, data),
  deleteCategoria: (id) => api.delete(`/categorias/${id}`),
}
