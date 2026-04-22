const bcrypt = require('bcryptjs')
const { z } = require('zod')

const db = require('../database')
const { signToken } = require('../utils/jwt')
const { createHttpError } = require('../utils/http')

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = db
      .prepare(
        `
          SELECT id, name, email, role, password_hash
          FROM users
          WHERE email = ?
        `
      )
      .get(email)

    if (!user) {
      throw createHttpError(401, 'Credenciales invalidas')
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      throw createHttpError(401, 'Credenciales invalidas')
    }

    const token = signToken(user)

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

const me = (req, res) => {
  res.json({
    user: req.user,
  })
}

module.exports = {
  login,
  me,
}
