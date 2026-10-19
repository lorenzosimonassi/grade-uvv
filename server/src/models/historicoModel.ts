import { prisma } from '../lib/prisma.js'

export const historicoModel = {
  listarDoUsuario(usuarioId: string) {
    return prisma.historicoItem.findMany({ where: { usuarioId }, select: { disciplinaId: true, status: true } })
  },
}
