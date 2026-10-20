import { DIAS, conflitam, hora, type TurmaNaGrade } from '../lib/horario'
import type { Dia, Horario } from '../lib/tipos'
import { TOM_PONTO } from './tons'
import type { Previa } from './useSimulador'

interface Props {
  grade: TurmaNaGrade[]
  tom: Map<string, number>
  previa: Previa | null
}

const NOME_COMPLETO: Record<Dia, string> = {
  SEG: 'Segunda-Feira',
  TER: 'Terça-Feira',
  QUA: 'Quarta-Feira',
  QUI: 'Quinta-Feira',
  SEX: 'Sexta-Feira',
  SAB: 'Sábado',
}

interface Aula {
  horario: Horario
  disciplinaId: string
  codigo: string
  nome: string
  tipo: 'grade' | 'previa'
  atingida: boolean
  substituida: boolean
}

/**
 * Aulas de um dia, uma por linha, como no portal. A prévia da turma sob o mouse entra tracejada;
 * se ela bate com uma aula da grade, essa aula fica marcada em vez de duplicar a linha.
 */
function aulasDoDia(dia: Dia, grade: TurmaNaGrade[], previa: Previa | null): Aula[] {
  const comPrevia = previa && previa.estado.tipo !== 'naGrade' ? previa : null

  const aulas: Aula[] = grade.flatMap((g) =>
    g.turma.horarios
      .filter((h) => h.diaSemana === dia)
      .map((h) => ({
        horario: h,
        disciplinaId: g.disciplinaId,
        codigo: g.disciplinaCodigo,
        nome: g.disciplinaNome,
        tipo: 'grade' as const,
        atingida: false,
        substituida: comPrevia?.disciplina.id === g.disciplinaId,
      })),
  )

  if (comPrevia) {
    for (const h of comPrevia.turma.horarios.filter((x) => x.diaSemana === dia)) {
      const batidas = aulas.filter((a) => !a.substituida && a.tipo === 'grade' && conflitam(a.horario, h))
      if (batidas.length > 0) batidas.forEach((a) => (a.atingida = true))
      else
        aulas.push({
          horario: h,
          disciplinaId: comPrevia.disciplina.id,
          codigo: comPrevia.disciplina.codigo,
          nome: comPrevia.disciplina.nome,
          tipo: 'previa',
          atingida: false,
          substituida: false,
        })
    }
  }

  return aulas.sort((a, b) => a.horario.inicioMin - b.horario.inicioMin)
}

/** A semana em colunas por dia, cada aula de 50 minutos numa linha própria. */
export function QuadroSemanal({ grade, tom, previa }: Props) {
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 @md:grid-cols-3 @4xl:grid-cols-6">
        {DIAS.map((d) => {
          const aulas = aulasDoDia(d.id, grade, previa)
          return (
            <section key={d.id} aria-label={NOME_COMPLETO[d.id]} className="min-w-0 self-start">
              <h4 className="rounded-t-[3px] border border-borda bg-chip px-2 py-2.5 text-center text-sm font-semibold text-titulo">
                {NOME_COMPLETO[d.id]}
              </h4>
              <ul className="mt-px rounded-b-[3px] border border-borda bg-cartao">
                {aulas.length === 0 ? (
                  <li className="px-2 py-3 text-center text-sm text-muted">-</li>
                ) : (
                  aulas.map((a) => (
                    <li
                      key={`${a.tipo}-${a.disciplinaId}-${a.horario.inicioMin}`}
                      title={a.nome}
                      className={`relative border-b border-divisor px-2 py-2.5 text-center transition-opacity last:border-b-0 ${
                        a.tipo === 'previa' ? 'bg-acao-suave/70 outline-[1.5px] -outline-offset-4 outline-acao outline-dashed' : ''
                      } ${a.substituida ? 'opacity-35' : ''} ${a.atingida ? 'bg-negative-bg ring-2 ring-negative ring-inset' : ''}`}
                    >
                      <p
                        className={`flex items-center justify-center gap-1.5 text-sm font-bold uppercase ${
                          a.tipo === 'previa' ? 'text-link-escuro' : 'text-ink'
                        }`}
                      >
                        {a.tipo === 'grade' && (
                          <span className={`size-2 flex-none rounded-full ${TOM_PONTO[tom.get(a.disciplinaId) ?? 1]}`} aria-hidden />
                        )}
                        <span className="num truncate">{a.codigo}</span>
                      </p>
                      <p className="num text-[13px] text-ink/80">
                        {hora(a.horario.inicioMin)} ~ {hora(a.horario.fimMin)}
                      </p>
                      {a.atingida && <p className="mt-0.5 text-[11px] font-semibold text-negative-ink">Conflito</p>}
                    </li>
                  ))
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
