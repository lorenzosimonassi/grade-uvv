import { describe, expect, it } from 'vitest'
import {
  aprovadas,
  cargaComCandidata,
  classificar,
  encontrarConflito,
  horariosConflitam,
  requisitosFaltando,
  type TurmaRegra,
} from './regras.js'

const turma = (id: string, disciplinaId: string, ...horarios: TurmaRegra['horarios']): TurmaRegra => ({
  id,
  disciplinaId,
  horarios,
})

describe('horariosConflitam', () => {
  it('detecta sobreposição no mesmo dia', () => {
    expect(
      horariosConflitam(
        { diaSemana: 'SEG', inicioMin: 1110, fimMin: 1230 },
        { diaSemana: 'SEG', inicioMin: 1200, fimMin: 1320 },
      ),
    ).toBe(true)
  })

  it('não considera conflito quando as aulas só se encostam', () => {
    expect(
      horariosConflitam(
        { diaSemana: 'SEG', inicioMin: 1110, fimMin: 1230 },
        { diaSemana: 'SEG', inicioMin: 1230, fimMin: 1350 },
      ),
    ).toBe(false)
  })

  it('não considera conflito em dias diferentes', () => {
    expect(
      horariosConflitam(
        { diaSemana: 'SEG', inicioMin: 1110, fimMin: 1230 },
        { diaSemana: 'TER', inicioMin: 1110, fimMin: 1230 },
      ),
    ).toBe(false)
  })

  it('detecta uma aula contida dentro da outra', () => {
    expect(
      horariosConflitam(
        { diaSemana: 'QUA', inicioMin: 450, fimMin: 700 },
        { diaSemana: 'QUA', inicioMin: 500, fimMin: 560 },
      ),
    ).toBe(true)
  })
})

describe('encontrarConflito', () => {
  const ed2 = turma('ed2-t01', 'ED2', { diaSemana: 'SEG', inicioMin: 1110, fimMin: 1350 })

  it('aponta a turma da grade que bate horário', () => {
    const bd2 = turma('bd2-t01', 'BD2', { diaSemana: 'SEG', inicioMin: 1230, fimMin: 1350 })
    const conflito = encontrarConflito(bd2, [ed2])
    expect(conflito?.turma.id).toBe('ed2-t01')
    expect(conflito?.horario).toEqual({ diaSemana: 'SEG', inicioMin: 1230, fimMin: 1350 })
  })

  it('ignora a turma atual da mesma disciplina (troca de turma)', () => {
    const ed2Manha = turma('ed2-t02', 'ED2', { diaSemana: 'SEG', inicioMin: 1110, fimMin: 1230 })
    expect(encontrarConflito(ed2Manha, [ed2])).toBeNull()
  })

  it('retorna null quando não há conflito', () => {
    const so = turma('so-t01', 'SO', { diaSemana: 'TER', inicioMin: 1110, fimMin: 1350 })
    expect(encontrarConflito(so, [ed2])).toBeNull()
  })
})

describe('pré-requisitos e pendências', () => {
  const historico = [
    { disciplinaId: 'ALG1', status: 'APROVADO' as const },
    { disciplinaId: 'LOG', status: 'REPROVADO' as const },
    { disciplinaId: 'COM', status: 'ADIADO' as const },
  ]
  const ok = aprovadas(historico)

  it('trava a disciplina quando um requisito não foi aprovado', () => {
    expect(requisitosFaltando({ id: 'LFA', periodo: 4, cargaHorariaSemanal: 4, requisitoIds: ['LOG'] }, ok)).toEqual([
      'LOG',
    ])
  })

  it('libera a disciplina quando todos os requisitos foram aprovados', () => {
    expect(requisitosFaltando({ id: 'ALG2', periodo: 2, cargaHorariaSemanal: 4, requisitoIds: ['ALG1'] }, ok)).toEqual(
      [],
    )
  })

  it('mostra reprovadas e adiadas de períodos anteriores como pendentes', () => {
    expect(classificar({ id: 'LOG', periodo: 2, cargaHorariaSemanal: 4, requisitoIds: [] }, 4, ok)).toBe('PENDENTE')
    expect(classificar({ id: 'COM', periodo: 1, cargaHorariaSemanal: 4, requisitoIds: [] }, 4, ok)).toBe('PENDENTE')
  })

  it('esconde aprovadas e disciplinas de períodos futuros', () => {
    expect(classificar({ id: 'ALG1', periodo: 1, cargaHorariaSemanal: 4, requisitoIds: [] }, 4, ok)).toBeNull()
    expect(classificar({ id: 'RED', periodo: 5, cargaHorariaSemanal: 4, requisitoIds: [] }, 4, ok)).toBeNull()
  })

  it('mostra as disciplinas do período atual', () => {
    expect(classificar({ id: 'ED2', periodo: 4, cargaHorariaSemanal: 4, requisitoIds: [] }, 4, ok)).toBe('PERIODO')
  })
})

describe('cargaComCandidata', () => {
  const cargas = new Map([
    ['ED2', 4],
    ['BD2', 4],
    ['SO', 6],
  ])

  it('soma a carga da candidata à da grade', () => {
    expect(cargaComCandidata({ disciplinaId: 'SO' }, [{ disciplinaId: 'ED2' }, { disciplinaId: 'BD2' }], cargas)).toBe(14)
  })

  it('não conta duas vezes a disciplina em troca de turma', () => {
    expect(cargaComCandidata({ disciplinaId: 'ED2' }, [{ disciplinaId: 'ED2' }], cargas)).toBe(4)
  })
})
