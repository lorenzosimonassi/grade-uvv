import { prisma } from '../lib/prisma.js'

export const cursoModel = {
  buscarPorCodigo(codigo: string) {
    return prisma.curso.findUnique({ where: { codigo } })
  },
}
