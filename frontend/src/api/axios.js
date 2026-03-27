import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If token expires (401), clear storage and reload to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('clinic_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
