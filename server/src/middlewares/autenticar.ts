import type { NextFunction, Request, Response } from 'express'
import { ErroApp } from '../lib/erros.js'
import { verificarToken } from '../services/authService.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuarioId?: string
    }
  }
}

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const [tipo, token] = req.headers.authorization?.split(' ') ?? []
  if (tipo !== 'Bearer' || !token) return next(new ErroApp(401, 'Entre na sua conta para continuar.'))

  try {
    req.usuarioId = verificarToken(token)
    next()
  } catch {
    next(new ErroApp(401, 'Sua sessão expirou. Entre novamente.'))
  }
}

/** Para controllers atrás de `autenticar`: o id está sempre presente. */
export function usuarioDa(req: Request): string {
  if (!req.usuarioId) throw new ErroApp(401, 'Entre na sua conta para continuar.')
  return req.usuarioId
}
