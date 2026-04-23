import axios from 'axios'

const explicitApiUrl = import.meta.env.VITE_API_URL?.trim() || ''
const browserHost = typeof window !== 'undefined' ? window.location.hostname : ''
const isLocalHost = ['localhost', '127.0.0.1'].includes(browserHost)
const isProductionBuild = import.meta.env.PROD
const requiresExplicitApiUrl = isProductionBuild && !explicitApiUrl && !isLocalHost
const baseURL = explicitApiUrl || '/api'

const createApiConfigurationError = () => {
  const error = new Error(
    'Falta configurar VITE_API_URL en Vercel para apuntar a tu backend de Render.'
  )
  error.code = 'MORAN_API_NOT_CONFIGURED'
  return error
}

export const apiRuntime = {
  baseURL,
  displayBaseURL: explicitApiUrl || '/api',
  isLocalHost,
  isProductionBuild,
  requiresExplicitApiUrl,
}

export const assertApiConfigured = () => {
  if (requiresExplicitApiUrl) {
    throw createApiConfigurationError()
  }
}

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  assertApiConfigured()

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
  (response) => {
    const contentType = String(response.headers?.['content-type'] || '')

    if (contentType.includes('text/html') && typeof response.data === 'string') {
      const error = new Error(
        'La aplicacion recibio HTML en lugar de una respuesta API. Revisa VITE_API_URL.'
      )
      error.code = 'MORAN_API_HTML_RESPONSE'
      error.response = response
      throw error
    }

    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('moran-studio-auth')
      window.dispatchEvent(new CustomEvent('moran-auth-expired'))
    }

    return Promise.reject(error)
  }
)
