import { prisma } from '../lib/prisma.js'

const turmaComHorarios = {
  turma: { select: { id: true, disciplinaId: true, horarios: true } },
} as const

export const simulacaoModel = {
  /** Busca a simulação do semestre, criando uma vazia na primeira visita. */
  obterOuCriar(usuarioId: string, semestreLetivo: string) {
    return prisma.simulacao.upsert({
      where: { usuarioId_semestreLetivo: { usuarioId, semestreLetivo } },
      update: {},
      create: { usuarioId, semestreLetivo },
      include: { turmas: { include: turmaComHorarios } },
    })
  },

  /** Coloca a turma na grade, tirando antes qualquer outra turma da mesma disciplina. */
  async substituirTurma(simulacaoId: string, turmaId: string, turmaAnteriorId: string | null) {
    await prisma.$transaction([
      ...(turmaAnteriorId
        ? [prisma.simulacaoTurma.delete({ where: { simulacaoId_turmaId: { simulacaoId, turmaId: turmaAnteriorId } } })]
        : []),
      prisma.simulacaoTurma.create({ data: { simulacaoId, turmaId } }),
      prisma.simulacao.update({ where: { id: simulacaoId }, data: { atualizadaEm: new Date() } }),
    ])
  },

  async removerTurma(simulacaoId: string, turmaId: string) {
    await prisma.$transaction([
      prisma.simulacaoTurma.deleteMany({ where: { simulacaoId, turmaId } }),
      prisma.simulacao.update({ where: { id: simulacaoId }, data: { atualizadaEm: new Date() } }),
    ])
  },

  async limpar(simulacaoId: string) {
    await prisma.simulacaoTurma.deleteMany({ where: { simulacaoId } })
  },
}
