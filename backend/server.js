const app = require('./src/app')
const env = require('./src/config/env')

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Moran Studio API listening on port ${env.PORT}`)
})
