import { prisma } from '../lib/prisma.js'

export const disciplinaModel = {
  /** Disciplinas do curso com requisitos e a oferta do semestre. */
  listarComOferta(cursoId: string, semestreLetivo: string) {
    return prisma.disciplina.findMany({
      where: { cursoId },
      orderBy: [{ periodo: 'asc' }, { nome: 'asc' }],
      include: {
        requisitos: { select: { requisito: { select: { id: true, codigo: true, nome: true } } } },
        turmas: {
          where: { semestreLetivo },
          orderBy: { codigo: 'asc' },
          include: { horarios: { orderBy: [{ diaSemana: 'asc' }, { inicioMin: 'asc' }] } },
        },
      },
    })
  },

  listarPorCodigos(cursoId: string, codigos: string[]) {
    return prisma.disciplina.findMany({ where: { cursoId, codigo: { in: codigos } }, select: { id: true, codigo: true } })
  },
}

export type DisciplinaComOferta = Awaited<ReturnType<typeof disciplinaModel.listarComOferta>>[number]
