// Regras de negócio puras: não tocam no banco, então são fáceis de testar.

export type Dia = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB'
export type Status = 'APROVADO' | 'REPROVADO' | 'ADIADO' | 'TRANCADO'

export interface Horario {
  diaSemana: Dia
  inicioMin: number
  fimMin: number
}

export interface TurmaRegra {
  id: string
  disciplinaId: string
  horarios: Horario[]
}

export interface DisciplinaRegra {
  id: string
  periodo: number
  cargaHorariaSemanal: number
  requisitoIds: string[]
}

/** Aulas que só se encostam (uma termina 20:30 e a outra começa 20:30) não conflitam. */
export function horariosConflitam(a: Horario, b: Horario): boolean {
  return a.diaSemana === b.diaSemana && a.inicioMin < b.fimMin && b.inicioMin < a.fimMin
}

export interface Conflito {
  turma: TurmaRegra
  horario: Horario
}

/**
 * Primeira turma da grade que bate horário com a candidata.
 * A turma atual da mesma disciplina é ignorada, porque escolher outra turma a substitui.
 */
export function encontrarConflito(candidata: TurmaRegra, grade: TurmaRegra[]): Conflito | null {
  for (const outra of grade) {
    if (outra.disciplinaId === candidata.disciplinaId) continue
    for (const a of candidata.horarios) {
      for (const b of outra.horarios) {
        if (horariosConflitam(a, b)) {
          return {
            turma: outra,
            horario: {
              diaSemana: a.diaSemana,
              inicioMin: Math.max(a.inicioMin, b.inicioMin),
              fimMin: Math.min(a.fimMin, b.fimMin),
            },
          }
        }
      }
    }
  }
  return null
}

export function aprovadas(historico: { disciplinaId: string; status: Status }[]): Set<string> {
  return new Set(historico.filter((h) => h.status === 'APROVADO').map((h) => h.disciplinaId))
}

/** Requisitos ainda não aprovados. Lista vazia = disciplina liberada. */
export function requisitosFaltando(disciplina: DisciplinaRegra, aprovadasIds: Set<string>): string[] {
  return disciplina.requisitoIds.filter((id) => !aprovadasIds.has(id))
}

export type Situacao = 'PERIODO' | 'PENDENTE'

/**
 * Disciplinas que aparecem para o aluno: as do período atual e as pendentes
 * (períodos anteriores sem aprovação). Já aprovadas e de períodos futuros ficam de fora.
 */
export function classificar(
  disciplina: DisciplinaRegra,
  periodoAtual: number,
  aprovadasIds: Set<string>,
): Situacao | null {
  if (aprovadasIds.has(disciplina.id)) return null
  if (disciplina.periodo === periodoAtual) return 'PERIODO'
  if (disciplina.periodo < periodoAtual) return 'PENDENTE'
  return null
}

/** Carga da grade se a candidata entrar, já descontando a turma que ela substitui. */
export function cargaComCandidata(
  candidata: { disciplinaId: string },
  grade: { disciplinaId: string }[],
  cargaPorDisciplina: Map<string, number>,
): number {
  const disciplinas = new Set(grade.map((t) => t.disciplinaId))
  disciplinas.add(candidata.disciplinaId)
  let total = 0
  for (const id of disciplinas) total += cargaPorDisciplina.get(id) ?? 0
  return total
}

const NOMES_DIA: Record<Dia, string> = {
  SEG: 'segunda',
  TER: 'terça',
  QUA: 'quarta',
  QUI: 'quinta',
  SEX: 'sexta',
  SAB: 'sábado',
}

export function nomeDia(dia: Dia): string {
  return NOMES_DIA[dia]
}

export function formatarHora(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
