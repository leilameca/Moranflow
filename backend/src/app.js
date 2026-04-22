const cors = require('cors')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')

const env = require('./config/env')
require('./database')

const { createRateLimiter } = require('./middleware/rateLimit')
const routes = require('./routes')
const { errorHandler } = require('./middleware/errorHandler')
const { createHttpError } = require('./utils/http')

const app = express()

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const originMatchesPattern = (origin, pattern) => {
  if (!pattern) {
    return false
  }

  if (!pattern.includes('*')) {
    return origin === pattern
  }

  const regex = new RegExp(`^${escapeRegex(pattern).replace(/\\\*/g, '.*')}$`)
  return regex.test(origin)
}

app.disable('x-powered-by')

if (env.TRUST_PROXY) {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        env.ALLOWED_ORIGINS.some((pattern) => originMatchesPattern(origin, pattern))
      ) {
        return callback(null, true)
      }

      return callback(createHttpError(403, 'Origen no permitido'))
    },
    optionsSuccessStatus: 204,
  })
)
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json({ limit: env.BODY_LIMIT }))
app.use(express.urlencoded({ extended: false, limit: env.BODY_LIMIT }))
app.use(
  '/api',
  createRateLimiter({
    windowMs: env.API_RATE_LIMIT_WINDOW_MS,
    max: env.API_RATE_LIMIT_MAX,
  })
)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Moran Studio Manager API',
  })
})

app.use('/api', routes)
app.use(errorHandler)

module.exports = app
