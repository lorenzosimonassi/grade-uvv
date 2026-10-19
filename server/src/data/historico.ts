import type { StatusHistorico } from '@prisma/client'
import { DISCIPLINAS } from './curriculo.js'

// Para cada período, quais disciplinas de períodos anteriores ficam pendentes.
// A reprovação de cada período é escolhida para travar uma disciplina do período atual,
// e "Comunicação e Expressão" fica adiada, sem dependentes, só como pendência.
const PENDENCIAS: Record<number, { codigo: string; status: StatusHistorico }[]> = {
  1: [],
  2: [{ codigo: 'MDI', status: 'REPROVADO' }], // trava LOG
  3: [{ codigo: 'ARQ', status: 'REPROVADO' }, { codigo: 'COM', status: 'ADIADO' }], // trava SDI
  4: [{ codigo: 'LOG', status: 'REPROVADO' }, { codigo: 'COM', status: 'ADIADO' }], // trava LFA
  5: [{ codigo: 'CAL2', status: 'REPROVADO' }, { codigo: 'COM', status: 'ADIADO' }], // trava CNU
  6: [{ codigo: 'LFA', status: 'REPROVADO' }, { codigo: 'COM', status: 'ADIADO' }], // trava COMP
  7: [{ codigo: 'SDS', status: 'REPROVADO' }, { codigo: 'COM', status: 'ADIADO' }], // trava NUV
  8: [{ codigo: 'GPR', status: 'REPROVADO' }, { codigo: 'COM', status: 'ADIADO' }], // trava GTI
}

/** Histórico mockado coerente com o período informado no cadastro. */
export function gerarHistorico(periodoAtual: number): { codigo: string; status: StatusHistorico }[] {
  const pendencias = PENDENCIAS[periodoAtual] ?? []
  const pendentes = new Map(pendencias.map((p) => [p.codigo, p.status]))

  return DISCIPLINAS.filter((d) => d.periodo < periodoAtual).map((d) => ({
    codigo: d.codigo,
    status: pendentes.get(d.codigo) ?? 'APROVADO',
  }))
}
