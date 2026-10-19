import { env } from '../config/env.js'
import { ErroApp } from '../lib/erros.js'
import { disciplinaModel, type DisciplinaComOferta } from '../models/disciplinaModel.js'
import { historicoModel } from '../models/historicoModel.js'
import { simulacaoModel } from '../models/simulacaoModel.js'
import { usuarioModel } from '../models/usuarioModel.js'
import {
  aprovadas,
  cargaComCandidata,
  classificar,
  encontrarConflito,
  formatarHora,
  nomeDia,
  requisitosFaltando,
  type DisciplinaRegra,
  type TurmaRegra,
} from './regras.js'

async function carregarContexto(usuarioId: string) {
  const usuario = await usuarioModel.buscarPublicoPorId(usuarioId)
  if (!usuario) throw new ErroApp(401, 'Sua sessão expirou. Entre novamente.')

  const [disciplinas, historico, simulacao] = await Promise.all([
    disciplinaModel.listarComOferta(usuario.cursoId, env.semestreAtivo),
    historicoModel.listarDoUsuario(usuarioId),
    simulacaoModel.obterOuCriar(usuarioId, env.semestreAtivo),
  ])

  const aprovadasIds = aprovadas(historico)
  const statusPorDisciplina = new Map(historico.map((h) => [h.disciplinaId, h.status]))
  const disciplinaPorId = new Map(disciplinas.map((d) => [d.id, d]))
  const grade: TurmaRegra[] = simulacao.turmas.map((st) => st.turma)

  return { usuario, disciplinas, aprovadasIds, statusPorDisciplina, disciplinaPorId, simulacao, grade }
}

const paraRegra = (d: DisciplinaComOferta): DisciplinaRegra => ({
  id: d.id,
  periodo: d.periodo,
  cargaHorariaSemanal: d.cargaHorariaSemanal,
  requisitoIds: d.requisitos.map((r) => r.requisito.id),
})

type Contexto = Awaited<ReturnType<typeof carregarContexto>>

function montarVisao(ctx: Contexto) {
  const { usuario, disciplinas, aprovadasIds, statusPorDisciplina, disciplinaPorId, simulacao, grade } = ctx

  const visiveis = disciplinas.flatMap((d) => {
    const situacao = classificar(paraRegra(d), usuario.periodoAtual, aprovadasIds)
    if (!situacao) return []
    const faltando = new Set(requisitosFaltando(paraRegra(d), aprovadasIds))
    return [
      {
        id: d.id,
        codigo: d.codigo,
        nome: d.nome,
        periodo: d.periodo,
        cargaHorariaSemanal: d.cargaHorariaSemanal,
        situacao,
        statusHistorico: statusPorDisciplina.get(d.id) ?? null,
        requisitosFaltando: d.requisitos
          .filter((r) => faltando.has(r.requisito.id))
          .map((r) => ({ codigo: r.requisito.codigo, nome: r.requisito.nome })),
        turmas: d.turmas.map((t) => ({
          id: t.id,
          codigo: t.codigo,
          professor: t.professor,
          sala: t.sala,
          horarios: t.horarios.map((h) => ({ diaSemana: h.diaSemana, inicioMin: h.inicioMin, fimMin: h.fimMin })),
        })),
      },
    ]
  })

  const cargaAtual = grade.reduce((soma, t) => soma + (disciplinaPorId.get(t.disciplinaId)?.cargaHorariaSemanal ?? 0), 0)

  return {
    semestre: env.semestreAtivo,
    limiteCargaHoraria: env.limiteCargaHoraria,
    cargaAtual,
    atualizadaEm: simulacao.atualizadaEm,
    disciplinas: visiveis,
    selecionadas: grade.map((t) => t.id),
  }
}

export type VisaoSimulador = ReturnType<typeof montarVisao>

export const simuladorService = {
  async obter(usuarioId: string) {
    return montarVisao(await carregarContexto(usuarioId))
  },

  async adicionarTurma(usuarioId: string, turmaId: string) {
    const ctx = await carregarContexto(usuarioId)

    const disciplina = ctx.disciplinas.find((d) => d.turmas.some((t) => t.id === turmaId))
    if (!disciplina) throw new ErroApp(404, 'Essa turma não é ofertada neste semestre.')
    const turma = disciplina.turmas.find((t) => t.id === turmaId)!
    const candidata: TurmaRegra = { id: turma.id, disciplinaId: disciplina.id, horarios: turma.horarios }

    if (ctx.grade.some((t) => t.id === turmaId)) return montarVisao(ctx)

    const regra = paraRegra(disciplina)
    if (!classificar(regra, ctx.usuario.periodoAtual, ctx.aprovadasIds)) {
      throw new ErroApp(422, `${disciplina.nome} não faz parte das suas disciplinas deste semestre.`, 'INDISPONIVEL')
    }

    const faltando = requisitosFaltando(regra, ctx.aprovadasIds)
    if (faltando.length > 0) {
      const nomes = faltando.map((id) => ctx.disciplinaPorId.get(id)?.nome ?? id).join(' e ')
      throw new ErroApp(422, `${disciplina.nome} exige ${nomes}, que você ainda não concluiu.`, 'PRE_REQUISITO')
    }

    const conflito = encontrarConflito(candidata, ctx.grade)
    if (conflito) {
      const outra = ctx.disciplinaPorId.get(conflito.turma.disciplinaId)
      const { diaSemana, inicioMin, fimMin } = conflito.horario
      throw new ErroApp(
        409,
        `A ${turma.codigo} de ${disciplina.nome} bate com ${outra?.nome ?? 'outra disciplina'} na ${nomeDia(diaSemana)}, das ${formatarHora(inicioMin)} às ${formatarHora(fimMin)}.`,
        'CONFLITO',
      )
    }

    const cargas = new Map(ctx.disciplinas.map((d) => [d.id, d.cargaHorariaSemanal]))
    const novaCarga = cargaComCandidata(candidata, ctx.grade, cargas)
    if (novaCarga > env.limiteCargaHoraria) {
      throw new ErroApp(
        422,
        `Com ${disciplina.nome} sua grade teria ${novaCarga}h semanais, acima do limite de ${env.limiteCargaHoraria}h.`,
        'LIMITE_CARGA',
      )
    }

    const anterior = ctx.grade.find((t) => t.disciplinaId === disciplina.id)
    await simulacaoModel.substituirTurma(ctx.simulacao.id, turmaId, anterior?.id ?? null)
    return this.obter(usuarioId)
  },

  async removerTurma(usuarioId: string, turmaId: string) {
    const ctx = await carregarContexto(usuarioId)
    await simulacaoModel.removerTurma(ctx.simulacao.id, turmaId)
    return this.obter(usuarioId)
  },

  async limpar(usuarioId: string) {
    const ctx = await carregarContexto(usuarioId)
    await simulacaoModel.limpar(ctx.simulacao.id)
    return this.obter(usuarioId)
  },
}
