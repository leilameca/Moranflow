import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL?.trim() || '/api'

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const auth = window.localStorage.getItem('moran-studio-auth')

  if (auth) {
    try {
      const { token } = JSON.parse(auth)

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      window.localStorage.removeItem('moran-studio-auth')
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('moran-studio-auth')
      window.dispatchEvent(new CustomEvent('moran-auth-expired'))
    }

    return Promise.reject(error)
  }
)
