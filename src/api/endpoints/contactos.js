import api from '../axios.js'

export const contactosApi = {
  getContactos: () => api.get('/contactos'),
  createContacto: (data) => api.post('/contactos', data),
  getContacto: (id) => api.get(`/contactos/${id}`),
  updateContacto: (id, data) => api.put(`/contactos/${id}`, data),
  deleteContacto: (id) => api.delete(`/contactos/${id}`),
}
