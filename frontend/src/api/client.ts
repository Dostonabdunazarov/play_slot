import axios from 'axios'

const api = axios.create({
  // Пустую строку из сборки (VITE_API_URL="") тоже трактуем как «звать /api на своём домене».
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only bounce to login if a logged-in session actually expired. Guests have
    // no token, so a 401 on a public read must not kick them to /login.
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
