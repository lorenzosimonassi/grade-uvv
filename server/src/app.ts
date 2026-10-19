import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { tratarErros } from './middlewares/tratarErros.js'
import { rotas } from './routes/index.js'

export const app = express()

app.use(cors({ origin: env.clientOrigin }))
app.use(express.json())

app.get('/api/saude', (_req, res) => {
  res.json({ ok: true })
})
app.use('/api', rotas)

app.use((_req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' })
})
app.use(tratarErros)
