import { AlertTriangle, CalendarCheck, CalendarPlus, CalendarX, Check, Lock, Search, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SelecaoCompacta, TituloPagina } from '../components/ui'
import { resumoHorarios } from '../lib/horario'
import type { Disciplina, Turma } from '../lib/tipos'
import type { EstadoTurma, Previa } from './useSimulador'

type Filtro = 'todas' | 'pendentes' | 'periodo' | 'naGrade'

interface Props {
  disciplinas: Disciplina[]
  periodoAtual: number
  semestre: string
  turmaDaDisciplina: Map<string, Turma>
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
  const { disciplinas, periodoAtual, semestre, turmaDaDisciplina } = props
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')

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

  return (
    <section aria-label="Disciplinas" className="flex min-w-0 flex-col gap-6">
      <TituloPagina titulo="Minhas Disciplinas">
        <div className="flex w-full gap-2 sm:w-auto">
          <SelecaoCompacta rotulo="Semestre" value={semestre} disabled className="w-[110px] flex-none">
            <option>{semestre}</option>
          </SelecaoCompacta>
          <SelecaoCompacta
            rotulo="Filtrar disciplinas"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            className="min-w-0 flex-1 sm:w-[200px]"
          >
            <option value="todas">Todas ({contagem.todas})</option>
            <option value="pendentes">Pendentes ({contagem.pendentes})</option>
            <option value="periodo">Do período ({contagem.periodo})</option>
            <option value="naGrade">Na grade ({contagem.naGrade})</option>
          </SelecaoCompacta>
        </div>
      </TituloPagina>

      <label className="relative block">
        <span className="sr-only">Buscar disciplina</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código"
          className="h-10 w-full rounded-[3px] border border-borda bg-white pr-3 pl-9 text-sm outline-none placeholder:text-muted/80 focus:border-acao focus:ring-3 focus:ring-acao/20"
        />
      </label>

      {visiveis.length === 0 && (
        <p className="rounded-[3px] border border-dashed border-borda bg-white/60 px-5 py-4 text-muted">
          {busca ? `Nenhuma disciplina encontrada para “${busca}”.` : 'Nenhuma disciplina neste filtro.'}
        </p>
      )}

      {pendentes.length > 0 && (
        <Grupo titulo="Pendentes de períodos anteriores">
          {pendentes.map((d) => (
            <CartaoDisciplina key={d.id} d={d} {...props} />
          ))}
        </Grupo>
      )}

      {doPeriodo.length > 0 && (
        <Grupo titulo={`${periodoAtual}º período`}>
          {doPeriodo.map((d) => (
            <CartaoDisciplina key={d.id} d={d} {...props} />
          ))}
        </Grupo>
      )}
    </section>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{titulo}</h2>
      <ul className="flex flex-col gap-6">{children}</ul>
    </div>
  )
}

/** O bloco colorido à direita do card, no lugar do "Acessar" do portal. */
function Indicador({ icone: Icone, rotulo, tom }: { icone: LucideIcon; rotulo: string; tom: string }) {
  return (
    <div className={`flex w-[92px] flex-none flex-col items-center justify-center gap-1.5 px-2 text-center sm:w-[102px] ${tom}`}>
      <Icone className="size-7" strokeWidth={2} aria-hidden />
      <span className="text-xs leading-tight">{rotulo}</span>
    </div>
  )
}

function CartaoDisciplina({
  d,
  turmaDaDisciplina,
  estadoDe,
  ocupada,
  onEscolher,
  onPrevia,
}: Props & { d: Disciplina }) {
  const travada = d.requisitosFaltando.length > 0
  const naGrade = turmaDaDisciplina.get(d.id)
  const semTurmas = d.turmas.length === 0
  const pendente = d.situacao === 'PENDENTE'

  const indicador = travada ? (
    <Indicador icone={Lock} rotulo="Travada" tom="bg-[#b9c0c9] text-white" />
  ) : naGrade ? (
    <Indicador icone={CalendarCheck} rotulo={`${naGrade.codigo} na grade`} tom="bg-acao text-white" />
  ) : semTurmas ? (
    <Indicador icone={CalendarX} rotulo="Sem turmas" tom="bg-faixa text-muted" />
  ) : (
    <Indicador icone={CalendarPlus} rotulo="Escolha a turma" tom="bg-acao-suave text-link" />
  )

  return (
    <li className="overflow-hidden rounded-[2px] bg-cartao shadow-[0_1px_2px_rgba(0,0,0,.1)]">
      <div className="flex min-h-[96px]">
        <div className="min-w-0 flex-1 px-5 py-4">
          <h3 className={`text-xl leading-snug font-light ${travada ? 'text-muted' : 'text-link'}`}>
            <span className="num">{d.codigo}</span> - {d.nome}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            {pendente && d.statusHistorico ? (
              <>
                <AlertTriangle className="size-3.5 flex-none text-ambar" aria-hidden />
                <span className="text-ambar">
                  {MOTIVO[d.statusHistorico]} no {d.periodo}º período
                </span>
                <span className="text-muted">· {d.cargaHorariaSemanal}h semanais</span>
              </>
            ) : (
              <span className="text-muted">
                {d.periodo}º período · {d.cargaHorariaSemanal}h semanais
              </span>
            )}
          </p>
        </div>
        {indicador}
      </div>

      <div className="bg-faixa px-5 pt-3 pb-4" onMouseLeave={() => onPrevia(null)}>
        {travada ? (
          <p className="flex items-center gap-1.5 text-[13px] text-titulo">
            <Lock className="size-3.5 flex-none" aria-hidden />
            Requer {d.requisitosFaltando.map((r) => r.nome).join(' e ')}.
          </p>
        ) : semTurmas ? (
          <p className="text-[13px] text-titulo">Nenhuma turma ofertada neste semestre.</p>
        ) : (
          <>
            <p className="text-xs text-muted italic">Turmas ofertadas:</p>
            <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
              {d.turmas.map((t) => (
                <ChipTurma
                  key={t.id}
                  turma={t}
                  estado={estadoDe(t, d)}
                  ocupada={ocupada === t.id}
                  onEscolher={() => onEscolher(t, d)}
                  onPrevia={(ativa) => onPrevia(ativa ? { turma: t, disciplina: d, estado: estadoDe(t, d) } : null)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </li>
  )
}

function ChipTurma({
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

  const status = ocupada ? (
    <span className="text-muted">Salvando…</span>
  ) : (
    {
      naGrade: (
        <span className="inline-flex items-center gap-1 font-semibold text-link-escuro">
          <Check className="size-3.5" aria-hidden /> Na grade · clique para remover
        </span>
      ),
      livre: (
        <span className="font-semibold text-positive">
          {estado.tipo === 'livre' && estado.substitui ? 'Trocar para esta' : 'Livre'}
        </span>
      ),
      conflito: (
        <span className="truncate font-semibold text-negative-ink">
          Bate com {estado.tipo === 'conflito' ? estado.conflito.com.disciplinaNome : ''}
        </span>
      ),
      limite: <span className="font-semibold text-warning-ink">Passa do limite de carga</span>,
    }[estado.tipo]
  )

  const acao = estado.tipo === 'naGrade' ? 'remover da grade' : bloqueada ? 'indisponível' : 'adicionar à grade'

  return (
    <button
      type="button"
      onClick={onEscolher}
      onMouseEnter={() => onPrevia(true)}
      onFocus={() => onPrevia(true)}
      onBlur={() => onPrevia(false)}
      aria-disabled={bloqueada}
      aria-label={`${turma.codigo}, ${resumoHorarios(turma.horarios)}, ${turma.professor}: ${acao}`}
      className={`flex min-w-0 flex-col gap-0.5 rounded-[2px] border border-l-4 px-3 py-2 text-left transition-colors ${
        estado.tipo === 'naGrade'
          ? 'border-acao bg-acao-suave'
          : estado.tipo === 'conflito'
            ? 'cursor-not-allowed border-negative/25 border-l-negative bg-negative-bg'
            : estado.tipo === 'limite'
              ? 'cursor-not-allowed border-warning-line border-l-ambar bg-warning-bg'
              : 'border-borda border-l-borda bg-chip hover:border-acao hover:bg-white'
      } ${ocupada ? 'opacity-60' : ''}`}
    >
      <span className="num truncate text-[13px] text-ink">
        <span className="font-bold">{turma.codigo}</span> · {resumoHorarios(turma.horarios)}
      </span>
      <span className="truncate text-xs text-muted">
        {turma.professor} · {turma.sala}
      </span>
      <span className="mt-0.5 truncate text-xs">{status}</span>
    </button>
  )
}
