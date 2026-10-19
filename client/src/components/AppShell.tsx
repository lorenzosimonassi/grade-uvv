import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  House,
  LayoutGrid,
  LogOut,
  Menu,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { Marca } from './ui'

interface ItemMenu {
  rotulo: string
  icone: LucideIcon
  ativo?: boolean
}

// Imita o menu do portal do aluno; só o simulador funciona aqui.
const GRUPOS: { titulo?: string; itens: ItemMenu[] }[] = [
  {
    itens: [
      { rotulo: 'Início', icone: House },
      { rotulo: 'Meus dados', icone: UserRound },
    ],
  },
  {
    titulo: 'Acadêmico',
    itens: [
      { rotulo: 'Notas e faltas', icone: ClipboardList },
      { rotulo: 'Horário de aulas', icone: CalendarDays },
      { rotulo: 'Biblioteca', icone: BookOpen },
    ],
  },
  {
    titulo: 'Matrícula',
    itens: [
      { rotulo: 'Simulador de grade', icone: LayoutGrid, ativo: true },
      { rotulo: 'Requerimentos', icone: FileText },
    ],
  },
  {
    titulo: 'Financeiro',
    itens: [{ rotulo: 'Boletos e pagamentos', icone: Wallet }],
  },
]

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes.at(-1)![0] : '')).toUpperCase()
}

function Navegacao() {
  return (
    <nav aria-label="Portal do aluno" className="flex flex-col gap-5">
      {GRUPOS.map((grupo, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {grupo.titulo && <p className="px-3 pb-1.5 text-xs text-muted">{grupo.titulo}</p>}
          {grupo.itens.map(({ rotulo, icone: Icone, ativo }) =>
            ativo ? (
              <a
                key={rotulo}
                href="/simulador"
                aria-current="page"
                className="flex h-9 items-center gap-2.5 rounded-lg bg-active px-3 font-medium text-ink"
              >
                <Icone className="size-4 text-accent" strokeWidth={1.75} aria-hidden />
                {rotulo}
              </a>
            ) : (
              <span
                key={rotulo}
                aria-disabled="true"
                title="Disponível apenas no portal oficial"
                className="flex h-9 cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-muted/70"
              >
                <Icone className="size-4" strokeWidth={1.5} aria-hidden />
                {rotulo}
              </span>
            ),
          )}
        </div>
      ))}
    </nav>
  )
}

function CartaoAluno() {
  const { usuario, sair } = useAuth()
  if (!usuario) return null
  return (
    <div className="flex items-center gap-3 rounded-xl bg-sheet/70 p-3">
      <span className="grid size-9 flex-none place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
        {iniciais(usuario.nome)}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate font-medium">{usuario.nome}</p>
        <p className="num truncate text-xs text-muted">
          {usuario.matricula}, {usuario.periodoAtual}º período
        </p>
      </div>
      <button
        type="button"
        onClick={sair}
        className="grid size-8 flex-none place-items-center rounded-lg text-muted hover:bg-active hover:text-ink"
        aria-label="Sair da conta"
        title="Sair"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

function CabecalhoMarca() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <Marca />
      <div className="leading-tight">
        <p className="font-semibold">Portal do Aluno</p>
        <p className="text-xs text-muted">Ciência da Computação</p>
      </div>
    </div>
  )
}

/**
 * Moldura em L: sidebar e barra do topo no mesmo tom, sem linha entre elas;
 * a página fica numa folha branca com 8px de recuo à direita e embaixo.
 */
export function AppShell({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    if (!menuAberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [menuAberto])

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[236px_minmax(0,1fr)] lg:grid-rows-[48px_minmax(0,1fr)]">
      {/* sidebar (desktop) */}
      <aside className="hidden lg:row-span-2 lg:flex lg:flex-col lg:gap-7 lg:overflow-y-auto lg:px-3 lg:pt-3 lg:pb-3">
        <div className="flex h-9 items-center">
          <CabecalhoMarca />
        </div>
        <Navegacao />
        <div className="mt-auto">
          <CartaoAluno />
        </div>
      </aside>

      {/* barra do topo */}
      <header className="sticky top-0 z-20 flex h-12 items-center gap-3 bg-frame px-4 lg:static lg:px-2">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg hover:bg-active lg:hidden"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
        <p className="text-muted">
          <span className="hidden sm:inline">Matrícula / </span>
          <span className="text-ink">{titulo}</span>
        </p>
      </header>

      {/* folha */}
      <div className="bg-sheet lg:mr-2 lg:mb-2 lg:overflow-y-auto lg:rounded-[var(--radius-sheet)] lg:border lg:border-line">
        {children}
      </div>

      {/* menu no celular */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink/30" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />
          <div className="relative flex h-full w-[min(320px,86vw)] flex-col gap-7 overflow-y-auto bg-frame p-3 shadow-xl">
            <div className="flex h-9 items-center justify-between">
              <CabecalhoMarca />
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg hover:bg-active"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <Navegacao />
            <div className="mt-auto">
              <CartaoAluno />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
