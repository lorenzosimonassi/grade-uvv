import { prisma } from '../lib/prisma.js'

export const solicitacaoModel = {
  criar(dados: {
    usuarioId: string
    semestreLetivo: string
    turmaId: string
    conflito: string
    mensagem: string
    gradeTurmaIds: string[]
  }) {
    return prisma.solicitacaoSecretaria.create({ data: dados, select: { id: true, criadoEm: true } })
  },
}
