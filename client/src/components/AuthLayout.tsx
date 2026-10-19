import type { ReactNode } from 'react'
import { Marca } from './ui'

// Prévia estática do quadro: o mesmo desenho do simulador, em miniatura.
const PREVIA = [
  { dia: 0, linha: 2, nome: 'Estrutura de Dados II', tom: 'd1' },
  { dia: 1, linha: 2, nome: 'Banco de Dados II', tom: 'd2' },
  { dia: 2, linha: 2, nome: 'Engenharia de Software I', tom: 'd3' },
  { dia: 3, linha: 2, nome: 'Sistemas Operacionais', tom: 'd4' },
  { dia: 1, linha: 0, nome: 'Comunicação e Expressão', tom: 'd5' },
  { dia: 3, linha: 0, nome: 'Comunicação e Expressão', tom: 'd5' },
] as const

const TONS: Record<string, string> = {
  d1: 'bg-d1 border-d1-edge',
  d2: 'bg-d2 border-d2-edge',
  d3: 'bg-d3 border-d3-edge',
  d4: 'bg-d4 border-d4-edge',
  d5: 'bg-d5 border-d5-edge',
}

function QuadroPrevia() {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const linhas = ['07:30', '09:40', '18:30']
  return (
    <div className="rounded-xl border border-line bg-sheet p-4" aria-hidden="true">
      <div className="grid grid-cols-[44px_repeat(5,1fr)] gap-1.5 text-xs">
        <div />
        {dias.map((d) => (
          <div key={d} className="pb-1 text-center font-medium text-muted">
            {d}
          </div>
        ))}
        {linhas.map((l, li) => (
          <div key={l} className="contents">
            <div className="num flex h-16 items-start pt-1 text-muted">{l}</div>
            {dias.map((_, di) => {
              const bloco = PREVIA.find((p) => p.dia === di && p.linha === li)
              return (
                <div key={di} className="h-16 rounded-md bg-raised">
                  {bloco && (
                    <div
                      className={`h-full rounded-md border-l-[3px] px-2 py-1.5 text-[11px] leading-tight font-medium text-ink ${TONS[bloco.tom]}`}
                    >
                      {bloco.nome}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex min-h-dvh flex-col bg-sheet px-5 py-8 sm:px-10 lg:min-h-0 lg:rounded-r-[var(--radius-sheet)] lg:border-r lg:border-line">
        <div className="flex items-center gap-2.5">
          <Marca />
          <div className="leading-tight">
            <p className="font-semibold">Portal do Aluno</p>
            <p className="text-xs text-muted">Simulador de grade</p>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-xs text-muted">Projeto acadêmico. Dados de exemplo do curso de Ciência da Computação.</p>
      </main>

      <aside className="hidden flex-col justify-center gap-8 px-12 py-10 lg:flex xl:px-20">
        <div className="max-w-[460px]">
          <p className="text-[28px] leading-tight font-semibold tracking-[-0.01em] text-balance">
            Monte o semestre sem conflito de horário.
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Antes de você escolher uma turma, o simulador avisa se ela bate com outra da sua grade. As disciplinas que
            ficaram pendentes aparecem junto com as do seu período.
          </p>
        </div>
        <div className="max-w-[560px]">
          <QuadroPrevia />
        </div>
      </aside>
    </div>
  )
}
