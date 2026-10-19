import { Check, ChevronDown, Lock, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { resumoHorarios } from '../lib/horario'
import type { Disciplina, Turma } from '../lib/tipos'
import { TOM_PONTO } from './tons'
import type { EstadoTurma, Previa } from './useSimulador'

type Filtro = 'todas' | 'pendentes' | 'periodo' | 'naGrade'

interface Props {
  disciplinas: Disciplina[]
  periodoAtual: number
  turmaDaDisciplina: Map<string, Turma>
  tom: Map<string, number>
  estadoDe: (t: Turma, d: Disciplina) => EstadoTurma
  ocupada: string | null
  onEscolher: (t: Turma, d: Disciplina) => void
  onPrevia: (p: Previa | null) => void
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const MOTIVO: Record<string, string> = {
  REPROVADO: 'Reprovada',
  ADIADO: 'Adiada',
  TRANCADO: 'Trancada',
}

export function ListaDisciplinas(props: Props) {
  const { disciplinas, periodoAtual, turmaDaDisciplina } = props
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [aberta, setAberta] = useState<string | null>(null)

  const contagem = useMemo(
    () => ({
      todas: disciplinas.length,
      pendentes: disciplinas.filter((d) => d.situacao === 'PENDENTE').length,
      periodo: disciplinas.filter((d) => d.situacao === 'PERIODO').length,
      naGrade: disciplinas.filter((d) => turmaDaDisciplina.has(d.id)).length,
    }),
    [disciplinas, turmaDaDisciplina],
  )

  const visiveis = disciplinas.filter((d) => {
    if (filtro === 'pendentes' && d.situacao !== 'PENDENTE') return false
    if (filtro === 'periodo' && d.situacao !== 'PERIODO') return false
    if (filtro === 'naGrade' && !turmaDaDisciplina.has(d.id)) return false
    if (busca && !normalizar(`${d.nome} ${d.codigo}`).includes(normalizar(busca))) return false
    return true
  })

  const pendentes = visiveis.filter((d) => d.situacao === 'PENDENTE')
  const doPeriodo = visiveis.filter((d) => d.situacao === 'PERIODO')

  const FILTROS: { id: Filtro; rotulo: string }[] = [
    { id: 'todas', rotulo: 'Todas' },
    { id: 'pendentes', rotulo: 'Pendentes' },
    { id: 'periodo', rotulo: 'Do período' },
    { id: 'naGrade', rotulo: 'Na grade' },
  ]

  return (
    <section aria-labelledby="titulo-disciplinas" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="titulo-disciplinas" className="text-base font-semibold">
          Disciplinas
        </h2>
        <p className="num text-xs text-muted">{contagem.todas} disponíveis para você</p>
      </div>

      <label className="relative block">
        <span className="sr-only">Buscar disciplina</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código"
          className="h-9 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-sm outline-none placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15"
        />
      </label>

      <div role="tablist" aria-label="Filtrar disciplinas" className="flex gap-1 overflow-x-auto rounded-lg bg-raised p-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-colors ${
              filtro === f.id ? 'bg-white font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-muted hover:text-ink'
            }`}
          >
            {f.rotulo}
            <span className="num text-xs text-muted">{contagem[f.id]}</span>
          </button>
        ))}
      </div>

      {visiveis.length === 0 && (
        <p className="rounded-lg border border-dashed border-control px-4 py-3 text-muted">
          {busca ? `Nenhuma disciplina encontrada para “${busca}”.` : 'Nenhuma disciplina neste filtro.'}
        </p>
      )}

      {pendentes.length > 0 && (
        <Grupo titulo="Pendentes de períodos anteriores" subtitulo="Reprovadas ou adiadas, ainda contam para você">
          {pendentes.map((d) => (
            <ItemDisciplina key={d.id} d={d} {...props} aberta={aberta === d.id} onAlternar={() => setAberta(aberta === d.id ? null : d.id)} />
          ))}
        </Grupo>
      )}

      {doPeriodo.length > 0 && (
        <Grupo titulo={`${periodoAtual}º período`}>
          {doPeriodo.map((d) => (
            <ItemDisciplina key={d.id} d={d} {...props} aberta={aberta === d.id} onAlternar={() => setAberta(aberta === d.id ? null : d.id)} />
          ))}
        </Grupo>
      )}
    </section>
  )
}

function Grupo({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-0.5 pt-1">
        <h3 className="text-[13px] font-medium">{titulo}</h3>
        {subtitulo && <p className="text-xs text-muted">{subtitulo}</p>}
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  )
}

function ItemDisciplina({
  d,
  aberta,
  onAlternar,
  turmaDaDisciplina,
  tom,
  estadoDe,
  ocupada,
  onEscolher,
  onPrevia,
}: Props & { d: Disciplina; aberta: boolean; onAlternar: () => void }) {
  const painelId = useId()
  const travada = d.requisitosFaltando.length > 0
  const naGrade = turmaDaDisciplina.get(d.id)
  const semTurmas = d.turmas.length === 0
  const pendente = d.situacao === 'PENDENTE'

  const meta = travada
    ? `Requer ${d.requisitosFaltando.map((r) => r.nome).join(' e ')}`
    : semTurmas
      ? 'Sem turmas neste semestre'
      : `${d.cargaHorariaSemanal}h semanais, ${d.turmas.length} ${d.turmas.length === 1 ? 'turma' : 'turmas'}`

  return (
    <li
      className={`rounded-xl border bg-white transition-colors ${
        aberta ? 'border-accent/40 ring-3 ring-accent/10' : 'border-line'
      } ${pendente ? 'border-l-[3px] border-l-warning-ink/60' : ''}`}
    >
      <button
        type="button"
        onClick={onAlternar}
        disabled={travada || semTurmas}
        aria-expanded={aberta}
        aria-controls={painelId}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left disabled:cursor-default"
      >
        {naGrade && <span className={`size-2 flex-none rounded-full ${TOM_PONTO[tom.get(d.id) ?? 1]}`} aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-medium ${travada ? 'text-muted' : ''}`}>{d.nome}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {pendente && d.statusHistorico && (
              <span className="text-warning-ink">
                {MOTIVO[d.statusHistorico]} no {d.periodo}º período.{' '}
              </span>
            )}
            {meta}
          </span>
        </span>
        {travada ? (
          <span className="inline-flex flex-none items-center gap-1 rounded-md bg-raised px-2 py-0.5 text-xs text-muted">
            <Lock className="size-3" aria-hidden /> Travada
          </span>
        ) : naGrade ? (
          <span className="flex-none rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
            {naGrade.codigo} na grade
          </span>
        ) : null}
        {!travada && !semTurmas && (
          <ChevronDown
            className={`size-4 flex-none text-muted transition-transform ${aberta ? 'rotate-180' : ''}`}
            aria-hidden
          />
        )}
      </button>

      {aberta && (
        <div id={painelId} className="flex flex-col gap-1.5 px-2 pb-2" onMouseLeave={() => onPrevia(null)}>
          {d.turmas.map((t) => (
            <OpcaoTurma
              key={t.id}
              turma={t}
              estado={estadoDe(t, d)}
              ocupada={ocupada === t.id}
              onEscolher={() => onEscolher(t, d)}
              onPrevia={(ativa) => onPrevia(ativa ? { turma: t, disciplina: d, estado: estadoDe(t, d) } : null)}
            />
          ))}
        </div>
      )}
    </li>
  )
}

function OpcaoTurma({
  turma,
  estado,
  ocupada,
  onEscolher,
  onPrevia,
}: {
  turma: Turma
  estado: EstadoTurma
  ocupada: boolean
  onEscolher: () => void
  onPrevia: (ativa: boolean) => void
}) {
  const bloqueada = estado.tipo === 'conflito' || estado.tipo === 'limite'

  const status = {
    naGrade: (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink">
        <Check className="size-3.5" aria-hidden /> Na grade
      </span>
    ),
    livre: (
      <span className="text-xs font-medium text-positive">
        {estado.tipo === 'livre' && estado.substitui ? 'Trocar para esta' : 'Livre'}
      </span>
    ),
    conflito: (
      <span className="max-w-[150px] truncate text-right text-xs font-medium text-negative-ink">
        Bate com {estado.tipo === 'conflito' ? estado.conflito.com.disciplinaNome : ''}
      </span>
    ),
    limite: <span className="text-xs font-medium text-warning-ink">Passa do limite</span>,
  }[estado.tipo]

  const acao =
    estado.tipo === 'naGrade' ? 'remover da grade' : bloqueada ? 'indisponível' : 'adicionar à grade'

  return (
    <button
      type="button"
      onClick={onEscolher}
      onMouseEnter={() => onPrevia(true)}
      onFocus={() => onPrevia(true)}
      onBlur={() => onPrevia(false)}
      aria-disabled={bloqueada}
      aria-label={`${turma.codigo}, ${resumoHorarios(turma.horarios)}, ${turma.professor}: ${acao}`}
      className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        estado.tipo === 'naGrade'
          ? 'border-accent/30 bg-accent-soft/60'
          : estado.tipo === 'conflito'
            ? 'cursor-not-allowed border-negative/15 bg-negative-bg/60'
            : estado.tipo === 'limite'
              ? 'cursor-not-allowed border-warning-line bg-warning-bg/70'
              : 'border-line hover:border-accent/50 hover:bg-accent-soft/40'
      } ${ocupada ? 'opacity-60' : ''}`}
    >
      <span className="min-w-0 flex-1">
        <span className="num flex gap-2.5 text-[13px]">
          <span className="font-semibold">{turma.codigo}</span>
          <span className="font-medium">{resumoHorarios(turma.horarios)}</span>
        </span>
        <span className="block truncate text-xs text-muted">
          {turma.professor}, {turma.sala}
        </span>
      </span>
      <span className="flex-none">{ocupada ? <span className="text-xs text-muted">Salvando…</span> : status}</span>
    </button>
  )
}
