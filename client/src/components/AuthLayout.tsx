import { CalendarCheck, ListChecks, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Marca } from './ui'

const DESTAQUES = [
  { icone: ShieldAlert, texto: 'Avisa o conflito de horário antes de você escolher a turma.' },
  { icone: ListChecks, texto: 'Disciplinas reprovadas ou adiadas aparecem junto com as do período.' },
  { icone: CalendarCheck, texto: 'Mostra a semana montada e a carga horária total.' },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-[72px] flex-none items-center border-b border-borda bg-white px-4 lg:h-[92px] lg:px-0">
        <div className="flex h-full items-center lg:w-[280px] lg:justify-center">
          <Marca />
        </div>
        <span className="mx-4 hidden h-8 w-px bg-borda sm:block lg:mx-2" aria-hidden />
        <p className="ml-3 text-base font-bold text-marinho sm:ml-0 lg:ml-6 lg:text-lg">Portal do Aluno</p>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full max-w-[920px] overflow-hidden rounded-[3px] bg-cartao shadow-[0_1px_3px_rgba(0,0,0,.12)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <aside className="hexagonos hidden flex-col justify-between gap-10 p-9 text-white md:flex">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#8fc3f0] uppercase">Simulador de grade</p>
              <p className="mt-3 text-[26px] leading-tight font-light text-balance">
                Monte o seu semestre sem conflito de horário.
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {DESTAQUES.map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-start gap-3 text-[13px] leading-relaxed text-sidebar-texto">
                  <Icone className="mt-0.5 size-[18px] flex-none text-[#8fc3f0]" strokeWidth={1.75} aria-hidden />
                  {texto}
                </li>
              ))}
            </ul>
          </aside>

          <div className="px-6 py-9 sm:px-10">{children}</div>
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-muted">
        Projeto acadêmico. Dados de exemplo do curso de Ciência da Computação.
      </footer>
    </div>
  )
}
