const path = require('path')

const DEFAULT_JWT_SECRET = 'moran-studio-secret-key'
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

const parseNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const parseBoolean = (value, fallback = false) => {
  if (typeof value !== 'string') {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const parseOrigins = (...values) =>
  [...new Set(values.flatMap((value) => String(value || '').split(',').map((item) => item.trim())).filter(Boolean))]

const resolvePath = (value, fallback) => {
  const target = value || fallback
  return path.isAbsolute(target) ? target : path.resolve(PROJECT_ROOT, target)
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'moran-studio-manager',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'moran-studio-frontend',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: parseOrigins(
    process.env.CORS_ORIGINS,
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ),
  BODY_LIMIT: process.env.BODY_LIMIT || '256kb',
  API_RATE_LIMIT_WINDOW_MS: parseNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  API_RATE_LIMIT_MAX: parseNumber(process.env.API_RATE_LIMIT_MAX, 300),
  AUTH_RATE_LIMIT_WINDOW_MS: parseNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 5),
  TRUST_PROXY: parseBoolean(process.env.TRUST_PROXY, false),
  DATABASE_PATH: resolvePath(
    process.env.DATABASE_PATH || process.env.DB_PATH,
    './data/moran-studio.db'
  ),
}

env.IS_PROD = env.NODE_ENV === 'production'

if (env.IS_PROD && env.JWT_SECRET === DEFAULT_JWT_SECRET) {
  throw new Error('JWT_SECRET debe configurarse en produccion con un valor seguro')
}

module.exports = env
