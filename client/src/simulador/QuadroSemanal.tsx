import { DIAS, conflitam, hora, type TurmaNaGrade } from '../lib/horario'
import type { Dia, Horario } from '../lib/tipos'
import { TOM_BLOCO } from './tons'
import type { Previa } from './useSimulador'

interface Faixa {
  inicioMin: number
  fimMin: number
}

interface Props {
  faixas: Faixa[]
  grade: TurmaNaGrade[]
  tom: Map<string, number>
  previa: Previa | null
}

const turno = (min: number) => (min < 12 * 60 ? 'Manhã' : min < 18 * 60 ? 'Tarde' : 'Noite')

function ocupa(h: Horario, dia: Dia, f: Faixa) {
  return h.diaSemana === dia && conflitam(h, { diaSemana: dia, ...f })
}

/**
 * Quadro da semana em linhas de horário (as faixas que existem na oferta) por colunas de dia.
 * A prévia da turma sob o mouse aparece tracejada; se ela bate com algo, o bloco atingido fica marcado.
 */
export function QuadroSemanal({ faixas, grade, tom, previa }: Props) {
  // Sábado fica sempre visível: a oferta tem turmas de sábado.
  const dias = DIAS
  const previaEmConflito = previa?.estado.tipo === 'conflito'

  return (
    <div className="overflow-x-auto rounded-xl border border-line" data-ui>
      <table className="w-full min-w-[640px] table-fixed border-collapse">
        <caption className="sr-only">Sua semana, por dia e horário</caption>
        <colgroup>
          <col className="w-[88px]" />
          {dias.map((d) => (
            <col key={d.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="h-10 border-b border-line bg-raised" />
            {dias.map((d) => (
              <th
                key={d.id}
                scope="col"
                className="h-10 border-b border-l border-line bg-raised text-xs font-medium text-muted"
              >
                {d.curto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {faixas.map((f, i) => {
            const novoTurno = i === 0 || turno(faixas[i - 1].inicioMin) !== turno(f.inicioMin)
            return (
              <tr key={`${f.inicioMin}-${f.fimMin}`} className={novoTurno && i > 0 ? 'border-t-[6px] border-t-raised' : ''}>
                <th scope="row" className="border-b border-rule px-3 py-2 text-left align-top font-normal">
                  {novoTurno && <span className="block text-[11px] text-muted">{turno(f.inicioMin)}</span>}
                  <span className="num block text-xs text-ink">{hora(f.inicioMin)}</span>
                  <span className="num block text-[11px] text-muted">{hora(f.fimMin)}</span>
                </th>
                {dias.map((d) => {
                  const bloco = grade.find((g) => g.turma.horarios.some((h) => ocupa(h, d.id, f)))
                  const previaAqui =
                    previa && previa.estado.tipo !== 'naGrade' && previa.turma.horarios.some((h) => ocupa(h, d.id, f))
                  const atingido = Boolean(bloco && previaAqui && previaEmConflito && bloco.disciplinaId !== previa?.disciplina.id)

                  return (
                    <td key={d.id} className="h-[76px] border-b border-l border-rule p-1 align-top">
                      <div className="relative h-full">
                        {bloco && (
                          <div
                            className={`h-full rounded-md border-l-[3px] px-2 py-1.5 transition-opacity ${TOM_BLOCO[tom.get(bloco.disciplinaId) ?? 1]} ${
                              previaAqui && !atingido && bloco.disciplinaId === previa?.disciplina.id ? 'opacity-35' : ''
                            } ${atingido ? 'ring-2 ring-negative ring-offset-1' : ''}`}
                          >
                            <p className="line-clamp-2 text-xs leading-snug font-medium text-ink">
                              {bloco.disciplinaNome}
                            </p>
                            <p className="num mt-0.5 truncate text-[11px] text-ink/70">
                              {bloco.turma.codigo}, {bloco.turma.sala}
                            </p>
                          </div>
                        )}
                        {previaAqui && !bloco && (
                          <div className="absolute inset-0 flex flex-col justify-start rounded-md border-[1.5px] border-dashed border-accent bg-accent-soft/50 px-2 py-1.5">
                            <p className="line-clamp-2 text-xs leading-snug font-medium text-accent-ink">
                              {previa!.disciplina.nome}
                            </p>
                            <p className="num text-[11px] text-accent-ink/80">{previa!.turma.codigo}</p>
                          </div>
                        )}
                        {atingido && (
                          <span className="absolute right-1 bottom-1 rounded bg-negative px-1.5 py-px text-[11px] font-medium text-white">
                            Conflito
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
