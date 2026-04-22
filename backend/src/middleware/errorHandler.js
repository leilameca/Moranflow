const { ZodError } = require('zod')

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos invalidos',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const status = error.status || 500

  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    console.error(error)
  }

  res.status(status).json({
    message: error.message || 'Error interno del servidor',
  })
}

module.exports = {
  errorHandler,
}
