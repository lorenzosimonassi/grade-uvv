import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { CURSO_CC, DISCIPLINAS } from '../src/data/curriculo.js'
import { gerarHistorico } from '../src/data/historico.js'
import { gerarOferta } from '../src/data/oferta.js'

const prisma = new PrismaClient()
const SEMESTRE = process.env.SEMESTRE_ATIVO ?? '2027/1'

export const ALUNO_DEMO = {
  nome: 'Aluno Demonstração',
  email: 'demo@grade-uvv.dev',
  matricula: '202400001',
  senha: 'grade1234',
  periodoAtual: 4,
}

async function main() {
  // O seed recria tudo do zero: é só dado mockado.
  await prisma.simulacaoTurma.deleteMany()
  await prisma.simulacao.deleteMany()
  await prisma.historicoItem.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.horarioAula.deleteMany()
  await prisma.turma.deleteMany()
  await prisma.preRequisito.deleteMany()
  await prisma.disciplina.deleteMany()
  await prisma.curso.deleteMany()

  const curso = await prisma.curso.create({ data: CURSO_CC })

  const idPorCodigo = new Map<string, string>()
  for (const d of DISCIPLINAS) {
    const criada = await prisma.disciplina.create({
      data: {
        codigo: d.codigo,
        nome: d.nome,
        periodo: d.periodo,
        cargaHorariaSemanal: d.cargaHorariaSemanal,
        cursoId: curso.id,
      },
    })
    idPorCodigo.set(d.codigo, criada.id)
  }

  await prisma.preRequisito.createMany({
    data: DISCIPLINAS.flatMap((d) =>
      d.requisitos.map((r) => ({ disciplinaId: idPorCodigo.get(d.codigo)!, requisitoId: idPorCodigo.get(r)! })),
    ),
  })

  const oferta = gerarOferta()
  for (const t of oferta) {
    await prisma.turma.create({
      data: {
        codigo: t.codigo,
        professor: t.professor,
        sala: t.sala,
        semestreLetivo: SEMESTRE,
        disciplinaId: idPorCodigo.get(t.disciplina)!,
        horarios: { createMany: { data: t.horarios } },
      },
    })
  }

  await prisma.usuario.create({
    data: {
      nome: ALUNO_DEMO.nome,
      email: ALUNO_DEMO.email,
      matricula: ALUNO_DEMO.matricula,
      periodoAtual: ALUNO_DEMO.periodoAtual,
      senhaHash: await bcrypt.hash(ALUNO_DEMO.senha, 10),
      cursoId: curso.id,
      historico: {
        createMany: {
          data: gerarHistorico(ALUNO_DEMO.periodoAtual).map((h) => ({
            disciplinaId: idPorCodigo.get(h.codigo)!,
            status: h.status,
          })),
        },
      },
    },
  })

  console.log(
    `Seed ok: ${DISCIPLINAS.length} disciplinas, ${oferta.length} turmas em ${SEMESTRE}. ` +
      `Aluno de demonstração: ${ALUNO_DEMO.email} / ${ALUNO_DEMO.senha}`,
  )
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
