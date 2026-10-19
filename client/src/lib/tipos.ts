export type Dia = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB'
export type StatusHistorico = 'APROVADO' | 'REPROVADO' | 'ADIADO' | 'TRANCADO'

export interface Usuario {
  id: string
  nome: string
  email: string
  matricula: string
  periodoAtual: number
  curso: { nome: string; codigo: string }
}

export interface Horario {
  diaSemana: Dia
  inicioMin: number
  fimMin: number
}

export interface Turma {
  id: string
  codigo: string
  professor: string
  sala: string
  horarios: Horario[]
}

export interface Disciplina {
  id: string
  codigo: string
  nome: string
  periodo: number
  cargaHorariaSemanal: number
  situacao: 'PERIODO' | 'PENDENTE'
  statusHistorico: StatusHistorico | null
  requisitosFaltando: { codigo: string; nome: string }[]
  turmas: Turma[]
}

export interface VisaoSimulador {
  semestre: string
  limiteCargaHoraria: number
  cargaAtual: number
  atualizadaEm: string
  disciplinas: Disciplina[]
  selecionadas: string[]
}
