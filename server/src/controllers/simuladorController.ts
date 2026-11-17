import type { Request, Response } from 'express'
import { z } from 'zod'
import { usuarioDa } from '../middlewares/autenticar.js'
import { simuladorService } from '../services/simuladorService.js'

const solicitacaoSchema = z.object({
  turmaId: z.string().min(1, 'Informe a turma.'),
  mensagem: z.string().trim().min(10, 'Escreva uma mensagem para a secretaria.').max(2000, 'A mensagem pode ter até 2000 caracteres.'),
})

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

  async solicitarSecretaria(req: Request, res: Response) {
    const { turmaId, mensagem } = solicitacaoSchema.parse(req.body)
    res.status(201).json(await simuladorService.solicitarSecretaria(usuarioDa(req), turmaId, mensagem))
  },
}
