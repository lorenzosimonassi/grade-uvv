import { app } from './app.js'
import { env } from './config/env.js'

app.listen(env.port, () => {
  console.log(`API do grade-uvv em http://localhost:${env.port}/api`)
})
