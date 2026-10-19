import { X } from 'lucide-react'
import { useMemo } from 'react'
import { AppShell } from '../components/AppShell'
import { Aviso, Botao, TituloPagina } from '../components/ui'
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
    <div className="border border-borda bg-cartao px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-titulo">Carga horária semanal</p>
        <p className="num text-titulo">
          <span className="text-2xl leading-none font-light text-link">{atual}h</span> de {limite}h
        </p>
      </div>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-faixa"
        role="meter"
        aria-label="Carga horária semanal"
        aria-valuemin={0}
        aria-valuemax={limite}
        aria-valuenow={atual}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${cheia ? 'bg-ambar' : 'bg-acao'}`}
          style={{ width: `${razao * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        {cheia ? 'Limite atingido. Remova uma disciplina para trocar.' : `Cabem mais ${limite - atual}h nesta grade.`}
      </p>
    </div>
  )
}

function Carregando() {
  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(380px,1fr)_minmax(520px,1.15fr)]" aria-busy="true" aria-label="Carregando">
      <div className="flex flex-col gap-6">
        <div className="h-12 border-b border-borda" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[180px] animate-pulse bg-white/70" />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <div className="h-12 border-b border-borda" />
        <div className="h-[420px] animate-pulse bg-white/70" />
      </div>
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
    <AppShell>
      <div className="px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        {s.erroCarga ? (
          <div className="flex max-w-[760px] flex-col gap-6">
            <TituloPagina titulo="Simulador de Grade" />
            <div className="flex items-center justify-between gap-4 border border-borda bg-cartao px-5 py-4">
              <p>{s.erroCarga}</p>
              <Botao onClick={s.carregar}>Tentar de novo</Botao>
            </div>
          </div>
        ) : !visao || !derivados || !usuario ? (
          <Carregando />
        ) : (
          <div className="grid items-start gap-10 xl:grid-cols-[minmax(380px,1fr)_minmax(520px,1.15fr)] xl:gap-12">
            <div className="flex min-w-0 flex-col gap-4">
              <ListaDisciplinas
                disciplinas={visao.disciplinas}
                periodoAtual={usuario.periodoAtual}
                semestre={visao.semestre}
                turmaDaDisciplina={derivados.turmaDaDisciplina}
                estadoDe={derivados.estadoDe}
                ocupada={s.ocupada}
                onEscolher={s.escolher}
                onPrevia={s.setPrevia}
              />
            </div>

            <section aria-labelledby="titulo-semana" className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-[116px]">
              <TituloPagina titulo="Sua Semana">
                <Botao onClick={s.limpar} disabled={s.ocupada !== null || derivados.grade.length === 0}>
                  Limpar grade
                </Botao>
              </TituloPagina>
              <h2 id="titulo-semana" className="sr-only">
                Sua semana
              </h2>

              <p className="-mt-2 text-[13px] text-muted">
                Semestre {visao.semestre}, {usuario.periodoAtual}º período. {resumo}
              </p>

              <BarraCarga atual={visao.cargaAtual} limite={visao.limiteCargaHoraria} />

              <div aria-live="assertive" className="empty:hidden">
                {s.alerta && (
                  <div className="relative">
                    <Aviso tom="erro">
                      <span className="block pr-7">{s.alerta}</span>
                    </Aviso>
                    <button
                      type="button"
                      onClick={s.fecharAlerta}
                      className="absolute top-2 right-2 grid size-6 place-items-center rounded-[2px] text-negative-ink hover:bg-negative/10"
                      aria-label="Fechar aviso"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted" aria-live="polite">
                  {s.previa
                    ? `Prévia: ${s.previa.disciplina.nome}, ${s.previa.turma.codigo}`
                    : 'Passe o mouse numa turma para ver onde ela cai na semana.'}
                </p>
                <QuadroSemanal faixas={faixas} grade={derivados.grade} tom={derivados.tom} previa={s.previa} />
              </div>

              <div className="border border-borda bg-cartao">
                <h3 className="border-b border-borda px-5 py-3 text-[15px] text-titulo">
                  Minha grade <span className="num text-muted">({derivados.grade.length})</span>
                </h3>
                {derivados.grade.length === 0 ? (
                  <p className="px-5 py-4 text-muted">
                    Nenhuma turma escolhida ainda. Clique numa turma livre de uma disciplina para adicioná-la.
                  </p>
                ) : (
                  <ul>
                    {derivados.grade.map((g) => {
                      const d = visao.disciplinas.find((x) => x.id === g.disciplinaId)!
                      return (
                        <li key={g.turma.id} className="flex items-center gap-3 border-b border-divisor px-5 py-3.5 last:border-b-0">
                          <span className={`size-2.5 flex-none rounded-full ${TOM_PONTO[derivados.tom.get(d.id) ?? 1]}`} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-link">{d.nome}</span>
                            <span className="num block truncate text-xs text-muted">
                              {g.turma.codigo} · {resumoHorarios(g.turma.horarios)} · {g.turma.professor}
                            </span>
                          </span>
                          <span className="num flex-none text-center text-link leading-tight">
                            {d.cargaHorariaSemanal}
                            <span className="block text-xs">h/sem</span>
                          </span>
                          <button
                            type="button"
                            className="grid size-8 flex-none place-items-center rounded-[2px] text-muted hover:bg-negative-bg hover:text-negative-ink disabled:opacity-50"
                            onClick={() => s.remover(g.turma.id)}
                            disabled={s.ocupada !== null}
                            aria-label={`Remover ${d.nome} da grade`}
                            title="Remover da grade"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  )
}
