import axios from 'axios'
import { isJwtExpired } from '../utils/jwt'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

let unauthorizedHandler = () => {}

/** Called from useAuth so 401 responses clear React auth state. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : () => {}
}

function isAuthRequestPath(url) {
  if (!url || typeof url !== 'string') return false
  const path = url.split('?')[0]
  return path === '/auth' || path.startsWith('/auth/')
}

api.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = {}
  }

  if (isAuthRequestPath(config.url)) {
    delete config.headers.Authorization
    return config
  }

  const token = localStorage.getItem('token')
  if (token && !isJwtExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      unauthorizedHandler()
    }
    return Promise.reject(error)
  },
)

export default api
