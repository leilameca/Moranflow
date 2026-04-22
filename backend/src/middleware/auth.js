const jwt = require('jsonwebtoken')

const env = require('../config/env')
const { createHttpError } = require('../utils/http')

const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, 'No autorizado'))
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER,
    })
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    }
    next()
  } catch (_error) {
    next(createHttpError(401, 'Token invalido o expirado'))
  }
}

module.exports = {
  requireAuth,
}
