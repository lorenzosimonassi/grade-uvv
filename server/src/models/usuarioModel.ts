import type { StatusHistorico } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

const semSenha = {
  id: true,
  nome: true,
  email: true,
  matricula: true,
  periodoAtual: true,
  cursoId: true,
  curso: { select: { nome: true, codigo: true } },
} as const

export const usuarioModel = {
  buscarPorMatricula(matricula: string) {
    return prisma.usuario.findUnique({ where: { matricula } })
  },

  buscarPublicoPorId(id: string) {
    return prisma.usuario.findUnique({ where: { id }, select: semSenha })
  },

  existeEmailOuMatricula(email: string, matricula: string) {
    return prisma.usuario.findFirst({ where: { OR: [{ email }, { matricula }] }, select: { email: true } })
  },

  /** Cria o usuário e o histórico mockado numa única transação. */
  criarComHistorico(dados: {
    nome: string
    email: string
    matricula: string
    senhaHash: string
    periodoAtual: number
    cursoId: string
    historico: { disciplinaId: string; status: StatusHistorico }[]
  }) {
    const { historico, ...usuario } = dados
    return prisma.usuario.create({
      data: { ...usuario, historico: { createMany: { data: historico } } },
      select: semSenha,
    })
  },
}

export type UsuarioPublico = NonNullable<Awaited<ReturnType<typeof usuarioModel.buscarPublicoPorId>>>
