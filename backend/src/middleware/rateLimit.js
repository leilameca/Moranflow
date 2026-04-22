const { createHttpError } = require('../utils/http')

const createRateLimiter = ({
  windowMs,
  max,
  message = 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
  keyGenerator = (req) => req.ip || 'global',
}) => {
  const store = new Map()
  let lastCleanupAt = 0

  return (req, res, next) => {
    const now = Date.now()

    if (now - lastCleanupAt > windowMs) {
      for (const [key, entry] of store.entries()) {
        if (entry.expiresAt <= now) {
          store.delete(key)
        }
      }

      lastCleanupAt = now
    }

    const key = String(keyGenerator(req) || 'global')
    const existingEntry = store.get(key)
    const entry =
      existingEntry && existingEntry.expiresAt > now
        ? existingEntry
        : {
            count: 0,
            expiresAt: now + windowMs,
          }

    entry.count += 1
    store.set(key, entry)

    const remaining = Math.max(max - entry.count, 0)
    const retryAfter = Math.max(Math.ceil((entry.expiresAt - now) / 1000), 1)

    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.expiresAt / 1000))

    if (entry.count > max) {
      res.setHeader('Retry-After', retryAfter)
      return next(createHttpError(429, message))
    }

    return next()
  }
}

module.exports = {
  createRateLimiter,
}
