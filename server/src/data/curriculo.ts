// Matriz curricular mockada de Ciência da Computação.
// Vale como fonte única para o seed e para a geração de histórico no cadastro.

export interface DisciplinaMock {
  codigo: string
  nome: string
  periodo: number
  cargaHorariaSemanal: number
  requisitos: string[]
}

export const CURSO_CC = { codigo: 'CC', nome: 'Ciência da Computação' }

export const DISCIPLINAS: DisciplinaMock[] = [
  // 1º período
  { codigo: 'ALG1', nome: 'Algoritmos e Programação I', periodo: 1, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'CAL1', nome: 'Cálculo I', periodo: 1, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'MDI', nome: 'Matemática Discreta', periodo: 1, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'FCO', nome: 'Fundamentos de Computação', periodo: 1, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'COM', nome: 'Comunicação e Expressão', periodo: 1, cargaHorariaSemanal: 4, requisitos: [] },
  // 2º período
  { codigo: 'ALG2', nome: 'Algoritmos e Programação II', periodo: 2, cargaHorariaSemanal: 4, requisitos: ['ALG1'] },
  { codigo: 'CAL2', nome: 'Cálculo II', periodo: 2, cargaHorariaSemanal: 4, requisitos: ['CAL1'] },
  { codigo: 'ALI', nome: 'Álgebra Linear', periodo: 2, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'ARQ', nome: 'Arquitetura de Computadores', periodo: 2, cargaHorariaSemanal: 4, requisitos: ['FCO'] },
  { codigo: 'LOG', nome: 'Lógica Matemática', periodo: 2, cargaHorariaSemanal: 4, requisitos: ['MDI'] },
  // 3º período
  { codigo: 'ED1', nome: 'Estrutura de Dados I', periodo: 3, cargaHorariaSemanal: 4, requisitos: ['ALG2'] },
  { codigo: 'POO', nome: 'Programação Orientada a Objetos', periodo: 3, cargaHorariaSemanal: 4, requisitos: ['ALG2'] },
  { codigo: 'PES', nome: 'Probabilidade e Estatística', periodo: 3, cargaHorariaSemanal: 4, requisitos: ['CAL1'] },
  { codigo: 'SDI', nome: 'Sistemas Digitais', periodo: 3, cargaHorariaSemanal: 4, requisitos: ['ARQ'] },
  { codigo: 'BD1', nome: 'Banco de Dados I', periodo: 3, cargaHorariaSemanal: 4, requisitos: ['ALG1'] },
  // 4º período
  { codigo: 'ED2', nome: 'Estrutura de Dados II', periodo: 4, cargaHorariaSemanal: 4, requisitos: ['ED1'] },
  { codigo: 'BD2', nome: 'Banco de Dados II', periodo: 4, cargaHorariaSemanal: 4, requisitos: ['BD1'] },
  { codigo: 'ES1', nome: 'Engenharia de Software I', periodo: 4, cargaHorariaSemanal: 4, requisitos: ['POO'] },
  { codigo: 'SO', nome: 'Sistemas Operacionais', periodo: 4, cargaHorariaSemanal: 4, requisitos: ['ARQ'] },
  { codigo: 'LFA', nome: 'Linguagens Formais e Autômatos', periodo: 4, cargaHorariaSemanal: 4, requisitos: ['LOG'] },
  // 5º período
  { codigo: 'RED', nome: 'Redes de Computadores', periodo: 5, cargaHorariaSemanal: 4, requisitos: ['SO'] },
  { codigo: 'AAL', nome: 'Análise de Algoritmos', periodo: 5, cargaHorariaSemanal: 4, requisitos: ['ED2'] },
  { codigo: 'ES2', nome: 'Engenharia de Software II', periodo: 5, cargaHorariaSemanal: 4, requisitos: ['ES1'] },
  { codigo: 'WEB', nome: 'Programação Web', periodo: 5, cargaHorariaSemanal: 4, requisitos: ['POO', 'BD1'] },
  { codigo: 'CNU', nome: 'Cálculo Numérico', periodo: 5, cargaHorariaSemanal: 4, requisitos: ['CAL2', 'ALI'] },
  // 6º período
  { codigo: 'COMP', nome: 'Compiladores', periodo: 6, cargaHorariaSemanal: 4, requisitos: ['LFA', 'ED2'] },
  { codigo: 'CGR', nome: 'Computação Gráfica', periodo: 6, cargaHorariaSemanal: 4, requisitos: ['ALI', 'ED1'] },
  { codigo: 'IA', nome: 'Inteligência Artificial', periodo: 6, cargaHorariaSemanal: 4, requisitos: ['PES', 'ED2'] },
  { codigo: 'SDS', nome: 'Sistemas Distribuídos', periodo: 6, cargaHorariaSemanal: 4, requisitos: ['RED'] },
  { codigo: 'IHC', nome: 'Interação Humano-Computador', periodo: 6, cargaHorariaSemanal: 4, requisitos: ['ES1'] },
  // 7º período
  { codigo: 'AM', nome: 'Aprendizado de Máquina', periodo: 7, cargaHorariaSemanal: 4, requisitos: ['IA'] },
  { codigo: 'SEG', nome: 'Segurança da Informação', periodo: 7, cargaHorariaSemanal: 4, requisitos: ['RED'] },
  { codigo: 'GPR', nome: 'Gerência de Projetos', periodo: 7, cargaHorariaSemanal: 4, requisitos: ['ES2'] },
  { codigo: 'TCC1', nome: 'Trabalho de Conclusão de Curso I', periodo: 7, cargaHorariaSemanal: 4, requisitos: ['ES2', 'AAL'] },
  { codigo: 'NUV', nome: 'Computação em Nuvem', periodo: 7, cargaHorariaSemanal: 4, requisitos: ['SDS'] },
  // 8º período
  { codigo: 'TCC2', nome: 'Trabalho de Conclusão de Curso II', periodo: 8, cargaHorariaSemanal: 4, requisitos: ['TCC1'] },
  { codigo: 'EMP', nome: 'Empreendedorismo', periodo: 8, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'ETI', nome: 'Ética e Computação', periodo: 8, cargaHorariaSemanal: 4, requisitos: [] },
  { codigo: 'TAV', nome: 'Tópicos Avançados em Computação', periodo: 8, cargaHorariaSemanal: 4, requisitos: ['AM'] },
  { codigo: 'GTI', nome: 'Governança de TI', periodo: 8, cargaHorariaSemanal: 4, requisitos: ['GPR'] },
]

export const TOTAL_PERIODOS = 8
