import type { DiaSemana } from '@prisma/client'
import { DISCIPLINAS } from './curriculo.js'

// Oferta mockada do semestre. Quando existir a importação do arquivo de oferta,
// ela substitui este gerador e preenche as mesmas tabelas (Turma + HorarioAula).

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

const h = (hora: number, minuto = 0) => hora * 60 + minuto

const BLOCOS = {
  M1: { inicioMin: h(7, 30), fimMin: h(9, 30) },
  M2: { inicioMin: h(9, 40), fimMin: h(11, 40) },
  N1: { inicioMin: h(18, 30), fimMin: h(20, 30) },
  N2: { inicioMin: h(20, 30), fimMin: h(22, 30) }, // encosta no N1, sem conflito
}

const DIAS_UTEIS: DiaSemana[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX']

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

    doPeriodo.forEach((disc, i) => {
      const sala = (bloco: string) => `Sala ${bloco}${periodo}${String(i + 1).padStart(2, '0')}`

      // T01 (noite): uma noite inteira por disciplina, então o período encaixa sem conflito.
      turmas.push({
        disciplina: disc.codigo,
        codigo: 'T01',
        professor: professor(),
        sala: sala('B'),
        horarios: [
          { diaSemana: DIAS_UTEIS[i], ...BLOCOS.N1 },
          { diaSemana: DIAS_UTEIS[i], ...BLOCOS.N2 },
        ],
      })

      // T02 (manhã): dois dias com dois de intervalo; colide de propósito com outras T02.
      turmas.push({
        disciplina: disc.codigo,
        codigo: 'T02',
        professor: professor(),
        sala: sala('A'),
        horarios: [
          { diaSemana: DIAS_UTEIS[i], ...BLOCOS.M1 },
          { diaSemana: DIAS_UTEIS[(i + 2) % 5], ...BLOCOS.M1 },
        ],
      })

      // T03 (sábado) só para algumas disciplinas.
      if (i === 1 || i === 4) {
        turmas.push({
          disciplina: disc.codigo,
          codigo: 'T03',
          professor: professor(),
          sala: sala('C'),
          horarios: [
            { diaSemana: 'SAB', ...BLOCOS.M1 },
            { diaSemana: 'SAB', ...BLOCOS.M2 },
          ],
        })
      }
    })
  }

  return turmas
}
