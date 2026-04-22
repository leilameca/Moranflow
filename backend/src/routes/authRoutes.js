const express = require('express')

const env = require('../config/env')
const { login, me } = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')
const { createRateLimiter } = require('../middleware/rateLimit')

const router = express.Router()
const loginRateLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: 'Demasiados intentos de inicio de sesion. Intenta otra vez en unos minutos.',
  keyGenerator: (req) => `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`,
})

router.post('/login', loginRateLimiter, login)
router.get('/me', requireAuth, me)

module.exports = router
