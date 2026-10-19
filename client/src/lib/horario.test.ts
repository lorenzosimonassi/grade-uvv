import { describe, expect, it } from 'vitest'
import { preverConflito, resumoHorarios } from './horario'
import type { Turma } from './tipos'

const turma = (id: string, horarios: Turma['horarios']): Turma => ({ id, codigo: id, professor: '', sala: '', horarios })

describe('resumoHorarios', () => {
  it('junta blocos seguidos do mesmo dia', () => {
    expect(
      resumoHorarios([
        { diaSemana: 'SEG', inicioMin: 1110, fimMin: 1230 },
        { diaSemana: 'SEG', inicioMin: 1230, fimMin: 1350 },
      ]),
    ).toBe('Seg 18:30–22:30')
  })

  it('agrupa dias com o mesmo horário', () => {
    expect(
      resumoHorarios([
        { diaSemana: 'QUA', inicioMin: 450, fimMin: 570 },
        { diaSemana: 'SEG', inicioMin: 450, fimMin: 570 },
      ]),
    ).toBe('Seg e Qua 07:30–09:30')
  })
})

describe('preverConflito', () => {
  const ed2 = turma('T01', [{ diaSemana: 'SEG', inicioMin: 1110, fimMin: 1350 }])
  const grade = [{ turma: ed2, disciplinaId: 'ED2', disciplinaNome: 'Estrutura de Dados II' }]

  it('acha a disciplina com que a turma bate', () => {
    const c = preverConflito(turma('T01', [{ diaSemana: 'SEG', inicioMin: 1230, fimMin: 1350 }]), 'BD2', grade)
    expect(c?.com.disciplinaNome).toBe('Estrutura de Dados II')
  })

  it('ignora a própria disciplina ao trocar de turma', () => {
    expect(preverConflito(turma('T02', [{ diaSemana: 'SEG', inicioMin: 1110, fimMin: 1230 }]), 'ED2', grade)).toBeNull()
  })
})
