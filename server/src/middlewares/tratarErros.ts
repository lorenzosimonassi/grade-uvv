import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ErroApp } from '../lib/erros.js'

export function tratarErros(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof ErroApp) {
    return res.status(erro.status).json({ mensagem: erro.message, codigo: erro.codigo })
  }

  if (erro instanceof ZodError) {
    const primeiro = erro.issues[0]
    return res.status(400).json({
      mensagem: primeiro?.message ?? 'Dados inválidos.',
      campos: erro.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    })
  }

  console.error(erro)
  return res.status(500).json({ mensagem: 'Algo deu errado no servidor. Tente de novo em instantes.' })
}
