import type { DiaSemana } from '@prisma/client'
import { CURSO_CC, DISCIPLINAS } from './curriculo.js'

// Oferta mockada do semestre. Quando existir a importação do arquivo de oferta,
// ela substitui este gerador e preenche as mesmas tabelas (Turma + HorarioAula).
//
// As turmas seguem o padrão da UVV: curso + período + turno, como CC4M (4º período, matutino)
// e CC6N (6º, noturno). Nos primeiros períodos, que têm mais alunos, a turma é dividida: CC1M e CC1Mb.

export interface HorarioMock {
  diaSemana: DiaSemana
  inicioMin: number
  fimMin: number
}

export interface TurmaMock {
  disciplina: string
  codigo: string
  professor: string
  sala: string
  horarios: HorarioMock[]
}

type Turno = 'M' | 'N'

const h = (hora: number, minuto = 0) => hora * 60 + minuto

/** Aulas de 50 minutos. De manhã cabem no máximo 5 por dia. */
const AULAS: Record<Turno, { inicioMin: number; fimMin: number }[]> = {
  M: [
    { inicioMin: h(7, 15), fimMin: h(8, 5) },
    { inicioMin: h(8, 5), fimMin: h(8, 55) },
    { inicioMin: h(9, 15), fimMin: h(10, 5) },
    { inicioMin: h(10, 5), fimMin: h(10, 55) },
    { inicioMin: h(11, 5), fimMin: h(11, 55) },
  ],
  // TODO: confirmar com o calendário da UVV; o início da noite pode ser 18:30 ou 19:15.
  N: [
    { inicioMin: h(18, 30), fimMin: h(19, 20) },
    { inicioMin: h(19, 20), fimMin: h(20, 10) },
    { inicioMin: h(20, 30), fimMin: h(21, 20) },
    { inicioMin: h(21, 20), fimMin: h(22, 10) },
  ],
}

/**
 * Cada disciplina tem 4 aulas por semana, em duas aulas duplas (índices em AULAS).
 * O layout alternativo da manhã usa a 5ª aula, então turmas vizinhas colidem só em parte.
 */
const DUPLAS = {
  padrao: [[0, 1], [2, 3]],
  deslocado: [[1, 2], [3, 4]],
}

const DIAS_UTEIS: DiaSemana[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX']

/** Turmas de cada período. O sufixo "b" é a turma dividida. */
function turmasDoPeriodo(periodo: number): { turno: Turno; sufixo: string }[] {
  const turmas: { turno: Turno; sufixo: string }[] = [{ turno: 'M', sufixo: '' }]
  if (periodo <= 2) turmas.push({ turno: 'M', sufixo: 'b' })
  turmas.push({ turno: 'N', sufixo: '' })
  if (periodo === 1) turmas.push({ turno: 'N', sufixo: 'b' })
  return turmas
}

const PROFESSORES = [
  'Ana Ribeiro', 'Carlos Lima', 'Fernanda Souza', 'Rafael Costa', 'Juliana Alves', 'Marcos Pereira',
  'Patrícia Gomes', 'Thiago Martins', 'Luciana Rocha', 'Eduardo Nunes', 'Camila Barros', 'Gustavo Teixeira',
]

export function gerarOferta(): TurmaMock[] {
  const turmas: TurmaMock[] = []
  let p = 0
  const professor = () => PROFESSORES[p++ % PROFESSORES.length]

  for (let periodo = 1; periodo <= 8; periodo++) {
    const doPeriodo = DISCIPLINAS.filter((d) => d.periodo === periodo)

    turmasDoPeriodo(periodo).forEach(({ turno, sufixo }, variante) => {
      const codigo = `${CURSO_CC.codigo}${periodo}${turno}${sufixo}`
      const aulas = AULAS[turno]
      // Manhã alterna o layout por período (e a turma "b" inverte), para variar os conflitos com pendências.
      const deslocado = turno === 'M' && (periodo % 2 === 0) !== (sufixo === 'b')
      const [dupla1, dupla2] = deslocado ? DUPLAS.deslocado : DUPLAS.padrao
      const giro = periodo + variante

      // A disciplina i ocupa a 1ª dupla no dia i e a 2ª dupla dois dias depois:
      // cada combinação dia + dupla é usada uma vez, então a turma não tem conflito interno.
      doPeriodo.forEach((disc, i) => {
        const dia1 = DIAS_UTEIS[(i + giro) % 5]
        const dia2 = DIAS_UTEIS[(i + giro + 2) % 5]
        turmas.push({
          disciplina: disc.codigo,
          codigo,
          professor: professor(),
          sala: `Sala ${turno === 'M' ? 'A' : 'B'}${periodo}${String(i + 1 + variante * 10).padStart(2, '0')}`,
          horarios: [
            ...dupla1.map((a) => ({ diaSemana: dia1, ...aulas[a] })),
            ...dupla2.map((a) => ({ diaSemana: dia2, ...aulas[a] })),
          ],
        })
      })
    })
  }

  return turmas
}
