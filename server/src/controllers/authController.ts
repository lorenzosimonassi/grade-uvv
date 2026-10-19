import type { Request, Response } from 'express'
import { z } from 'zod'
import { TOTAL_PERIODOS } from '../data/curriculo.js'
import { usuarioDa } from '../middlewares/autenticar.js'
import { authService } from '../services/authService.js'

const cadastroSchema = z.object({
  nome: z.string().trim().min(3, 'Informe seu nome completo.'),
  email: z.email('Informe um email válido.').trim().toLowerCase(),
  matricula: z.string().trim().regex(/^\d{6,12}$/, 'A matrícula deve ter apenas números (6 a 12 dígitos).'),
  periodoAtual: z.coerce
    .number()
    .int()
    .min(1, 'Escolha seu período atual.')
    .max(TOTAL_PERIODOS, `O curso vai até o ${TOTAL_PERIODOS}º período.`),
  senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
})

const loginSchema = z.object({
  matricula: z.string().trim().min(1, 'Informe sua matrícula.'),
  senha: z.string().min(1, 'Informe sua senha.'),
})

export const authController = {
  async cadastrar(req: Request, res: Response) {
    const dados = cadastroSchema.parse(req.body)
    res.status(201).json(await authService.cadastrar(dados))
  },

  async entrar(req: Request, res: Response) {
    const { matricula, senha } = loginSchema.parse(req.body)
    res.json(await authService.entrar(matricula, senha))
  },

  async perfil(req: Request, res: Response) {
    res.json(await authService.perfil(usuarioDa(req)))
  },
}
