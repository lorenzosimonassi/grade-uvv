import { RotateCcw, X } from 'lucide-react'
import { useMemo } from 'react'
import { AppShell } from '../components/AppShell'
import { Botao } from '../components/ui'
import { useAuth } from '../lib/auth'
import { resumoHorarios } from '../lib/horario'
import { ListaDisciplinas } from '../simulador/ListaDisciplinas'
import { QuadroSemanal } from '../simulador/QuadroSemanal'
import { TOM_PONTO } from '../simulador/tons'
import { useSimulador } from '../simulador/useSimulador'

function BarraCarga({ atual, limite }: { atual: number; limite: number }) {
  const razao = Math.min(atual / limite, 1)
  const cheia = atual >= limite
  return (
    <div className="w-full sm:w-[260px]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">Carga semanal</p>
        <p className="num">
          <span className="text-[22px] leading-none font-medium">{atual}h</span>
          <span className="text-muted"> de {limite}h</span>
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-raised"
        role="meter"
        aria-label="Carga horária semanal"
        aria-valuemin={0}
        aria-valuemax={limite}
        aria-valuenow={atual}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${cheia ? 'bg-warning-ink' : 'bg-accent'}`}
          style={{ width: `${razao * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {cheia ? 'Limite atingido. Remova uma disciplina para trocar.' : `Cabem mais ${limite - atual}h nesta grade.`}
      </p>
    </div>
  )
}

function Carregando() {
  return (
    <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[400px_minmax(0,1fr)]" aria-busy="true" aria-label="Carregando">
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[62px] rounded-xl bg-raised" />
        ))}
      </div>
      <div className="h-[420px] rounded-xl bg-raised" />
    </div>
  )
}

export function SimuladorPage() {
  const { usuario } = useAuth()
  const s = useSimulador()
  const { visao, derivados } = s

  const faixas = useMemo(() => {
    if (!visao) return []
    const unicas = new Map<string, { inicioMin: number; fimMin: number }>()
    for (const d of visao.disciplinas)
      for (const t of d.turmas)
        for (const h of t.horarios) unicas.set(`${h.inicioMin}-${h.fimMin}`, { inicioMin: h.inicioMin, fimMin: h.fimMin })
    return [...unicas.values()].sort((a, b) => a.inicioMin - b.inicioMin)
  }, [visao])

  const resumo = useMemo(() => {
    if (!visao) return ''
    const pendentes = visao.disciplinas.filter((d) => d.situacao === 'PENDENTE').length
    const travadas = visao.disciplinas.filter((d) => d.requisitosFaltando.length > 0).length
    const partes = [
      pendentes > 0 && `${pendentes} ${pendentes === 1 ? 'disciplina pendente' : 'disciplinas pendentes'}`,
      travadas > 0 && `${travadas} ${travadas === 1 ? 'travada' : 'travadas'} por pré-requisito`,
    ].filter(Boolean)
    return partes.length ? `Você tem ${partes.join(' e ')}.` : 'Todas as disciplinas do seu período estão liberadas.'
  }, [visao])

  return (
    <AppShell titulo="Simulador de grade">
      {s.erroCarga ? (
        <div className="p-6">
          <h1 className="text-[22px] font-semibold">Simulador de grade</h1>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
            <p>{s.erroCarga}</p>
            <Botao variante="secundario" onClick={s.carregar}>
              Tentar de novo
            </Botao>
          </div>
        </div>
      ) : !visao || !derivados || !usuario ? (
        <Carregando />
      ) : (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          {/* título */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Simulador de grade</h1>
              <p className="mt-1 text-muted">
                Semestre {visao.semestre}, {usuario.periodoAtual}º período de {usuario.curso.nome}. {resumo}
              </p>
            </div>
            <BarraCarga atual={visao.cargaAtual} limite={visao.limiteCargaHoraria} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
            <ListaDisciplinas
              disciplinas={visao.disciplinas}
              periodoAtual={usuario.periodoAtual}
              turmaDaDisciplina={derivados.turmaDaDisciplina}
              tom={derivados.tom}
              estadoDe={derivados.estadoDe}
              ocupada={s.ocupada}
              onEscolher={s.escolher}
              onPrevia={s.setPrevia}
            />

            <section aria-labelledby="titulo-semana" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-3">
                <h2 id="titulo-semana" className="text-base font-semibold">
                  Sua semana
                </h2>
                <p className="text-xs text-muted" aria-live="polite">
                  {s.previa
                    ? `Prévia: ${s.previa.disciplina.nome}, ${s.previa.turma.codigo}`
                    : 'Passe o mouse numa turma para ver onde ela cai'}
                </p>
              </div>

              <div aria-live="assertive">
                {s.alerta && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-negative/20 bg-negative-bg px-4 py-3 text-negative-ink"
                  >
                    <p className="flex-1">{s.alerta}</p>
                    <button
                      type="button"
                      onClick={s.fecharAlerta}
                      className="grid size-6 flex-none place-items-center rounded-md hover:bg-negative/10"
                      aria-label="Fechar aviso"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <QuadroSemanal faixas={faixas} grade={derivados.grade} tom={derivados.tom} previa={s.previa} />

              <div className="rounded-xl border border-line">
                <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
                  <h3 className="font-medium">
                    Na sua grade <span className="num font-normal text-muted">{derivados.grade.length}</span>
                  </h3>
                  {derivados.grade.length > 0 && (
                    <Botao variante="texto" className="h-8 px-2 text-muted" onClick={s.limpar} disabled={s.ocupada !== null}>
                      <RotateCcw className="size-3.5" aria-hidden /> Limpar grade
                    </Botao>
                  )}
                </div>
                {derivados.grade.length === 0 ? (
                  <p className="px-4 pb-4 text-muted">
                    Nenhuma turma escolhida ainda. Abra uma disciplina na lista e escolha uma turma livre.
                  </p>
                ) : (
                  <ul className="pb-1">
                    {derivados.grade.map((g) => {
                      const d = visao.disciplinas.find((x) => x.id === g.disciplinaId)!
                      return (
                        <li key={g.turma.id} className="flex items-center gap-3 border-t border-rule px-4 py-2.5">
                          <span className={`size-2 flex-none rounded-full ${TOM_PONTO[derivados.tom.get(d.id) ?? 1]}`} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{d.nome}</span>
                            <span className="num block truncate text-xs text-muted">
                              {g.turma.codigo}, {resumoHorarios(g.turma.horarios)}, {g.turma.professor}
                            </span>
                          </span>
                          <span className="num flex-none text-muted">{d.cargaHorariaSemanal}h</span>
                          <Botao
                            variante="texto"
                            className="h-8 flex-none px-2"
                            onClick={() => s.remover(g.turma.id)}
                            disabled={s.ocupada !== null}
                          >
                            Remover
                          </Botao>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  )
}
