import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

export function Marca({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
      <rect x="7" y="8" width="8" height="7" rx="1.5" fill="#fff" />
      <rect x="17" y="8" width="8" height="7" rx="1.5" fill="#fff" opacity=".45" />
      <rect x="7" y="17" width="8" height="7" rx="1.5" fill="#fff" opacity=".45" />
      <rect x="17" y="17" width="8" height="7" rx="1.5" fill="#fff" />
    </svg>
  )
}

type Variante = 'primario' | 'secundario' | 'texto'

const variantes: Record<Variante, string> = {
  primario: 'bg-primary text-white hover:bg-black active:bg-black disabled:bg-control',
  secundario: 'bg-sheet text-ink border border-control hover:bg-raised active:bg-active disabled:text-muted',
  texto: 'text-ink hover:bg-raised active:bg-active disabled:text-muted',
}

export function Botao({
  variante = 'primario',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantes[variante]} ${className}`}
    >
      {children}
    </button>
  )
}

interface CampoBase {
  rotulo: string
  erro?: string
  dica?: ReactNode
}

const classeCampo =
  'h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15'

export const Campo = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CampoBase>(
  function Campo({ rotulo, erro, dica, id, ...props }, ref) {
    const campoId = id ?? props.name
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={campoId} className="text-sm font-medium">
          {rotulo}
        </label>
        <input
          ref={ref}
          id={campoId}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${campoId}-erro` : undefined}
          className={`${classeCampo} ${erro ? 'border-negative' : 'border-line'}`}
          {...props}
        />
        {erro ? (
          <p id={`${campoId}-erro`} className="text-xs text-negative-ink">
            {erro}
          </p>
        ) : (
          dica && <p className="text-xs text-muted">{dica}</p>
        )}
      </div>
    )
  },
)

export function Selecao({
  rotulo,
  erro,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & CampoBase) {
  const campoId = id ?? props.name
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={campoId} className="text-sm font-medium">
        {rotulo}
      </label>
      <select
        id={campoId}
        aria-invalid={Boolean(erro)}
        className={`${classeCampo} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path d=%22M4 6l4 4 4-4%22 fill=%22none%22 stroke=%22%235d5f60%22 stroke-width=%221.5%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 ${erro ? 'border-negative' : 'border-line'}`}
        {...props}
      >
        {children}
      </select>
      {erro && <p className="text-xs text-negative-ink">{erro}</p>}
    </div>
  )
}

export function Aviso({ tom, children }: { tom: 'erro' | 'info'; children: ReactNode }) {
  const cores =
    tom === 'erro'
      ? 'bg-negative-bg text-negative-ink border-negative/20'
      : 'bg-warning-bg text-warning-ink border-warning-line'
  return (
    <div role={tom === 'erro' ? 'alert' : 'status'} className={`rounded-lg border px-3.5 py-2.5 text-sm ${cores}`}>
      {children}
    </div>
  )
}
