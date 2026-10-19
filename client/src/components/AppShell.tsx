import {
  BookOpen,
  CalendarDays,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Repeat,
  Scale,
  Table2,
  UserRound,
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

// O mesmo menu do portal do aluno; aqui só o simulador funciona.
const MENU: ItemMenu[] = [
  { rotulo: 'Dashboard', icone: LayoutDashboard },
  { rotulo: 'Informações Pessoais', icone: UserRound },
  { rotulo: 'Mensagens', icone: Mail },
  { rotulo: 'Horários', icone: Clock },
  { rotulo: 'Quadro Curricular', icone: Table2 },
  { rotulo: 'Simulador de Grade', icone: LayoutGrid, ativo: true },
  { rotulo: 'Financeiro', icone: DollarSign },
  { rotulo: 'Agendamento Financeiro', icone: Scale },
  { rotulo: 'Secretaria On-line', icone: Landmark },
  { rotulo: 'Calendário de Atividades', icone: CalendarDays },
  { rotulo: 'Carteira de Estudante', icone: CreditCard },
  { rotulo: 'Histórico Escolar', icone: BookOpen },
  { rotulo: 'Boletins', icone: FileText },
  { rotulo: 'Rematrícula', icone: Repeat },
]

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes.at(-1)![0] : '')).toUpperCase()
}

function Perfil() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return (
    <div className="hexagonos flex flex-col items-center px-5 pt-6 pb-5 text-center text-white">
      <span className="grid size-[84px] place-items-center rounded-full border-4 border-white bg-[#5a6a99] text-2xl font-semibold tracking-wide shadow-md">
        {iniciais(usuario.nome)}
      </span>
      <p className="mt-4 text-[13px] leading-snug font-semibold uppercase">{usuario.nome}</p>
      <p className="num text-[13px] text-[#8fc3f0]">Matrícula: {usuario.matricula}</p>
      <p className="text-[13px] leading-snug">
        {usuario.curso.nome} - {usuario.periodoAtual}º período
      </p>
    </div>
  )
}

function Navegacao() {
  return (
    <nav aria-label="Menu do portal" className="py-1">
      <ul>
        {MENU.map(({ rotulo, icone: Icone, ativo }) => (
          <li key={rotulo}>
            {ativo ? (
              <a
                href="/simulador"
                aria-current="page"
                className="flex h-12 items-center gap-3.5 border-l-4 border-acao bg-sidebar-ativo pr-4 pl-[22px] font-semibold text-white"
              >
                <Icone className="size-[18px]" strokeWidth={2} aria-hidden />
                {rotulo}
              </a>
            ) : (
              <span
                aria-disabled="true"
                title="Disponível apenas no portal oficial"
                className="flex h-12 cursor-default items-center gap-3.5 border-l-4 border-transparent pr-4 pl-[22px] text-sidebar-texto/85 hover:bg-white/5"
              >
                <Icone className="size-[18px]" strokeWidth={1.75} aria-hidden />
                {rotulo}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Moldura do portal: barra branca no topo, sidebar azul-marinho e conteúdo em cinza claro. */
export function AppShell({ children }: { children: ReactNode }) {
  const { sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    if (!menuAberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [menuAberto])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-[72px] flex-none items-center border-b border-borda bg-white lg:h-[92px]">
        <button
          type="button"
          className="ml-2 grid size-10 place-items-center rounded text-marinho hover:bg-chip lg:hidden"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-6" strokeWidth={1.75} />
        </button>
        <div className="flex h-full items-center px-3 lg:w-[280px] lg:justify-center lg:px-0">
          <Marca />
        </div>
        <span className="mx-2 hidden h-8 w-px bg-borda lg:block" aria-hidden />
        <p className="ml-1 text-base font-bold text-marinho lg:ml-6 lg:text-lg">Portal do Aluno</p>
        <button
          type="button"
          onClick={sair}
          className="mr-3 ml-auto flex flex-col items-center gap-0.5 rounded px-3 py-1.5 text-xs text-ink hover:bg-chip lg:mr-6"
        >
          <LogOut className="size-6 text-titulo" strokeWidth={2.25} aria-hidden />
          Sair
        </button>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[280px] flex-none bg-sidebar lg:block">
          <div className="sticky top-[92px] max-h-[calc(100dvh-92px)] overflow-y-auto">
            <Perfil />
            <Navegacao />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/40" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />
          <div className="relative h-full w-[min(300px,86vw)] overflow-y-auto bg-sidebar shadow-xl">
            <button
              type="button"
              className="absolute top-2 right-2 z-10 grid size-9 place-items-center rounded text-white hover:bg-white/10"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            <Perfil />
            <Navegacao />
          </div>
        </div>
      )}
    </div>
  )
}
