import { describe, expect, it } from 'vitest'
import type { TurmaNaGrade } from '../lib/horario'
import type { Turma } from '../lib/tipos'
import { montarQuadro } from './exportarPdf'

const naGrade = (id: string, horarios: Turma['horarios']): TurmaNaGrade => ({
  turma: { id, codigo: id, professor: '', sala: '', horarios },
  disciplinaId: id,
  disciplinaCodigo: id,
  disciplinaNome: id,
})

describe('montarQuadro', () => {
  it('repete a disciplina em cada horário seguido e marca o intervalo', () => {
    const a = naGrade('A', [
      { diaSemana: 'SEG', inicioMin: 435, fimMin: 485 },
      { diaSemana: 'SEG', inicioMin: 485, fimMin: 535 },
    ])
    const b = naGrade('B', [{ diaSemana: 'TER', inicioMin: 555, fimMin: 605 }])
    const { dias, linhas } = montarQuadro([a, b])

    expect(dias).toEqual(['SEG', 'TER', 'QUA', 'QUI', 'SEX'])
    expect(linhas.map((l) => (l.tipo === 'aulas' ? l.celulas.slice(0, 2) : l.tipo))).toEqual([
      [a, null],
      [a, null],
      'intervalo',
      [null, b],
    ])
  })

  it('não mostra intervalo entre turnos', () => {
    const { linhas } = montarQuadro([
      naGrade('A', [
        { diaSemana: 'QUA', inicioMin: 485, fimMin: 535 },
        { diaSemana: 'QUA', inicioMin: 1110, fimMin: 1160 },
      ]),
    ])

    expect(linhas.map((l) => l.tipo)).toEqual(['aulas', 'aulas'])
  })

  it('só mostra o sábado quando tem aula nele', () => {
    expect(montarQuadro([naGrade('A', [{ diaSemana: 'SAB', inicioMin: 435, fimMin: 485 }])]).dias).toContain('SAB')
  })
})
