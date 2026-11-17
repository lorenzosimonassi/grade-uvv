import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ErroApi } from '../lib/api'
import { mensagemConflito, preverConflito, type ConflitoPrevisto, type TurmaNaGrade } from '../lib/horario'
import type { Disciplina, Turma, VisaoSimulador } from '../lib/tipos'

export type EstadoTurma =
  | { tipo: 'naGrade' }
  | { tipo: 'livre'; substitui: boolean }
  | { tipo: 'conflito'; conflito: ConflitoPrevisto }
  | { tipo: 'limite'; cargaFinal: number }

export interface Previa {
  turma: Turma
  disciplina: Disciplina
  estado: EstadoTurma
}

/** A última tentativa barrada por conflito, para poder levar o caso à secretaria. */
export interface TentativaConflito {
  turma: Turma
  disciplina: Disciplina
  conflito: ConflitoPrevisto
}

export function useSimulador() {
  const [visao, setVisao] = useState<VisaoSimulador | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)
  const [alerta, setAlerta] = useState<string | null>(null)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [tentativa, setTentativa] = useState<TentativaConflito | null>(null)

  const mostrarAlerta = useCallback((texto: string | null) => {
    setAlerta(texto)
    setTentativa(null)
  }, [])

  const carregar = useCallback(() => {
    setErroCarga(null)
    api
      .simulador()
      .then(setVisao)
      .catch((e) => setErroCarga(e instanceof ErroApi ? e.message : 'Não foi possível carregar o simulador.'))
  }, [])

  useEffect(carregar, [carregar])

  const derivados = useMemo(() => {
    if (!visao) return null
    const selecionadas = new Set(visao.selecionadas)

    const grade: TurmaNaGrade[] = []
    const turmaDaDisciplina = new Map<string, Turma>()
    for (const d of visao.disciplinas) {
      for (const t of d.turmas) {
        if (selecionadas.has(t.id)) {
          grade.push({ turma: t, disciplinaId: d.id, disciplinaCodigo: d.codigo, disciplinaNome: d.nome })
          turmaDaDisciplina.set(d.id, t)
        }
      }
    }

    // Tom de cada disciplina fixo pela posição na lista, para não mudar de cor ao remover outra.
    const tom = new Map(visao.disciplinas.map((d, i) => [d.id, (i % 7) + 1]))

    const estadoDe = (turma: Turma, disciplina: Disciplina): EstadoTurma => {
      if (selecionadas.has(turma.id)) return { tipo: 'naGrade' }
      const conflito = preverConflito(turma, disciplina.id, grade)
      if (conflito) return { tipo: 'conflito', conflito }
      const substitui = turmaDaDisciplina.has(disciplina.id)
      const cargaFinal = visao.cargaAtual + (substitui ? 0 : disciplina.cargaHorariaSemanal)
      if (cargaFinal > visao.limiteCargaHoraria) return { tipo: 'limite', cargaFinal }
      return { tipo: 'livre', substitui }
    }

    return { selecionadas, grade, turmaDaDisciplina, tom, estadoDe }
  }, [visao])

  const escolher = useCallback(
    async (turma: Turma, disciplina: Disciplina) => {
      if (!derivados || ocupada) return
      const estado = derivados.estadoDe(turma, disciplina)

      // Bloqueio imediato no front; a API repete as mesmas verificações.
      if (estado.tipo === 'conflito') {
        setAlerta(`Não dá para adicionar. ${mensagemConflito(turma.codigo, disciplina.nome, estado.conflito)}`)
        setTentativa({ turma, disciplina, conflito: estado.conflito })
        return
      }
      if (estado.tipo === 'limite' && visao) {
        mostrarAlerta(
          `Não dá para adicionar. Com ${disciplina.nome} sua grade teria ${estado.cargaFinal}h semanais, acima do limite de ${visao.limiteCargaHoraria}h.`,
        )
        return
      }

      setOcupada(turma.id)
      mostrarAlerta(null)
      try {
        setVisao(
          estado.tipo === 'naGrade' ? await api.removerTurma(turma.id) : await api.adicionarTurma(turma.id),
        )
        setPrevia(null)
      } catch (e) {
        mostrarAlerta(e instanceof ErroApi ? e.message : 'Não foi possível salvar a alteração.')
      } finally {
        setOcupada(null)
      }
    },
    [derivados, ocupada, visao, mostrarAlerta],
  )

  const remover = useCallback(async (turmaId: string) => {
    setOcupada(turmaId)
    try {
      setVisao(await api.removerTurma(turmaId))
    } catch (e) {
      mostrarAlerta(e instanceof ErroApi ? e.message : 'Não foi possível remover a turma.')
    } finally {
      setOcupada(null)
    }
  }, [mostrarAlerta])

  const limpar = useCallback(async () => {
    setOcupada('todas')
    try {
      setVisao(await api.limparGrade())
      mostrarAlerta(null)
    } catch (e) {
      mostrarAlerta(e instanceof ErroApi ? e.message : 'Não foi possível limpar a grade.')
    } finally {
      setOcupada(null)
    }
  }, [mostrarAlerta])

  return {
    visao,
    derivados,
    erroCarga,
    carregar,
    alerta,
    mostrarAlerta,
    fecharAlerta: () => mostrarAlerta(null),
    tentativa,
    ocupada,
    previa,
    setPrevia,
    escolher,
    remover,
    limpar,
  }
}
