const jwt = require('jsonwebtoken')

const env = require('../config/env')

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    {
      audience: env.JWT_AUDIENCE,
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
    }
  )

module.exports = {
  signToken,
}
