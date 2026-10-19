import type { Request, Response } from 'express'
import { usuarioDa } from '../middlewares/autenticar.js'
import { simuladorService } from '../services/simuladorService.js'

export const simuladorController = {
  async obter(req: Request, res: Response) {
    res.json(await simuladorService.obter(usuarioDa(req)))
  },

  async adicionarTurma(req: Request<{ turmaId: string }>, res: Response) {
    res.json(await simuladorService.adicionarTurma(usuarioDa(req), req.params.turmaId))
  },

  async removerTurma(req: Request<{ turmaId: string }>, res: Response) {
    res.json(await simuladorService.removerTurma(usuarioDa(req), req.params.turmaId))
  },

  async limpar(req: Request, res: Response) {
    res.json(await simuladorService.limpar(usuarioDa(req)))
  },
}
