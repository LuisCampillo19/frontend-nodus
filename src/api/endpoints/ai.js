import api from '../axios.js'

export const aiApi = {
  chat: (data) => api.post('/ai/chat', data),
}
