import axios from 'axios'
import { useAuthStore } from '../stores/authStore.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      const { refreshToken, setToken, logout } = useAuthStore.getState()
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newToken = res.data.data.access_token
        setToken(newToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        processQueue(new Error('Sesión expirada'))
        logout()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
