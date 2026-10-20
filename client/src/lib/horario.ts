import type { Dia, Horario, Turma } from './tipos'

// Mesma regra do back-end, repetida aqui só para a prévia visual.
// Quem decide de verdade é a API.

export const DIAS: { id: Dia; curto: string; nome: string }[] = [
  { id: 'SEG', curto: 'Seg', nome: 'segunda' },
  { id: 'TER', curto: 'Ter', nome: 'terça' },
  { id: 'QUA', curto: 'Qua', nome: 'quarta' },
  { id: 'QUI', curto: 'Qui', nome: 'quinta' },
  { id: 'SEX', curto: 'Sex', nome: 'sexta' },
  { id: 'SAB', curto: 'Sáb', nome: 'sábado' },
]

const nomeDia = (dia: Dia) => DIAS.find((d) => d.id === dia)!.nome
const curtoDia = (dia: Dia) => DIAS.find((d) => d.id === dia)!.curto

/** Aulas separadas por até isso (o intervalo da UVV) contam como seguidas. */
const INTERVALO_MAX = 20

export function hora(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function conflitam(a: Horario, b: Horario): boolean {
  return a.diaSemana === b.diaSemana && a.inicioMin < b.fimMin && b.inicioMin < a.fimMin
}

export interface TurmaNaGrade {
  turma: Turma
  disciplinaId: string
  disciplinaNome: string
}

export interface ConflitoPrevisto {
  com: TurmaNaGrade
  horario: Horario
}

export function preverConflito(
  candidata: Turma,
  disciplinaId: string,
  grade: TurmaNaGrade[],
): ConflitoPrevisto | null {
  for (const outra of grade) {
    if (outra.disciplinaId === disciplinaId) continue
    for (const a of candidata.horarios) {
      for (const b of outra.turma.horarios) {
        if (conflitam(a, b)) {
          return {
            com: outra,
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

export function mensagemConflito(codigoTurma: string, disciplina: string, c: ConflitoPrevisto): string {
  return `A ${codigoTurma} de ${disciplina} bate com ${c.com.disciplinaNome} na ${nomeDia(c.horario.diaSemana)}, das ${hora(c.horario.inicioMin)} às ${hora(c.horario.fimMin)}.`
}

/**
 * Resumo legível dos horários: junta aulas seguidas do mesmo dia, mesmo com o intervalo no meio
 * ("Seg 07:15–08:55") e dias com o mesmo horário ("Seg e Qua 07:15–08:55").
 */
export function resumoHorarios(horarios: Horario[]): string {
  const porDia = new Map<Dia, Horario[]>()
  for (const h of horarios) porDia.set(h.diaSemana, [...(porDia.get(h.diaSemana) ?? []), h])

  const faixas: { dia: Dia; inicio: number; fim: number }[] = []
  for (const d of DIAS) {
    const doDia = (porDia.get(d.id) ?? []).sort((a, b) => a.inicioMin - b.inicioMin)
    for (const h of doDia) {
      const ultima = faixas.at(-1)
      if (ultima && ultima.dia === d.id && ultima.fim >= h.inicioMin - INTERVALO_MAX) ultima.fim = Math.max(ultima.fim, h.fimMin)
      else faixas.push({ dia: d.id, inicio: h.inicioMin, fim: h.fimMin })
    }
  }

  const porFaixa = new Map<string, Dia[]>()
  for (const f of faixas) {
    const chave = `${hora(f.inicio)}–${hora(f.fim)}`
    porFaixa.set(chave, [...(porFaixa.get(chave) ?? []), f.dia])
  }

  return [...porFaixa.entries()]
    .map(([faixa, dias]) => `${dias.map(curtoDia).join(' e ')} ${faixa}`)
    .join(', ')
}
