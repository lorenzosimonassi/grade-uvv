import { ChevronDown } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

/** Selo redondo (azul com aro dourado) usado na marca e no favicon. */
export function Selo({ className = 'size-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#c9a227" />
      <circle cx="24" cy="24" r="20" fill="var(--color-marinho)" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="#c9a227" strokeWidth=".8" strokeDasharray="1.2 1.6" />
      <rect x="15" y="15" width="8" height="8" rx="1.2" fill="#fff" />
      <rect x="25" y="15" width="8" height="8" rx="1.2" fill="#fff" opacity=".5" />
      <rect x="15" y="25" width="8" height="8" rx="1.2" fill="#fff" opacity=".5" />
      <rect x="25" y="25" width="8" height="8" rx="1.2" fill="#c9a227" />
    </svg>
  )
}

/** Marca do topo: selo + nome da universidade em versalete serifado. */
export function Marca() {
  return (
    <span className="flex items-center gap-2.5 text-marinho">
      <Selo />
      <span className="hidden leading-none sm:block" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <span className="block text-[9px] tracking-[0.32em]">UNIVERSIDADE</span>
        <span className="block text-[19px] tracking-[0.02em]">VILA VELHA</span>
        <span className="mt-0.5 block text-[7px] tracking-[0.3em] text-muted">ESPÍRITO SANTO</span>
      </span>
    </span>
  )
}

/** Título de página no estilo do portal: fonte leve, controle à direita e linha embaixo. */
export function TituloPagina({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-borda pb-3">
      <h1 className="text-[28px] leading-tight font-light text-titulo">{titulo}</h1>
      {children}
    </div>
  )
}

type Variante = 'primario' | 'secundario' | 'texto'

const variantes: Record<Variante, string> = {
  primario: 'bg-acao text-white hover:bg-acao-hover disabled:bg-borda disabled:text-muted',
  secundario: 'bg-cartao text-ink border border-borda hover:bg-chip disabled:text-muted',
  texto: 'text-link hover:bg-acao-suave disabled:text-muted',
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
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-[3px] px-3.5 text-sm transition-colors disabled:cursor-not-allowed ${variantes[variante]} ${className}`}
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
  'h-10 w-full rounded-[3px] border bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/80 focus:border-acao focus:ring-3 focus:ring-acao/20'

export const Campo = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CampoBase>(
  function Campo({ rotulo, erro, dica, id, ...props }, ref) {
    const campoId = id ?? props.name
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={campoId} className="text-[13px] font-semibold text-titulo">
          {rotulo}
        </label>
        <input
          ref={ref}
          id={campoId}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${campoId}-erro` : undefined}
          className={`${classeCampo} ${erro ? 'border-negative' : 'border-borda'}`}
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

const setaSelect = 'appearance-none pr-8 disabled:bg-chip disabled:text-titulo'

function Seta() {
  return (
    <ChevronDown
      className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-titulo"
      strokeWidth={2}
      aria-hidden
    />
  )
}

export function Selecao({
  rotulo,
  erro,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & CampoBase) {
  const campoId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className="text-[13px] font-semibold text-titulo">
        {rotulo}
      </label>
      <div className="relative">
        <select
          id={campoId}
          aria-invalid={Boolean(erro)}
          className={`${classeCampo} ${setaSelect} ${erro ? 'border-negative' : 'border-borda'}`}
          {...props}
        >
          {children}
        </select>
        <Seta />
      </div>
      {erro && <p className="text-xs text-negative-ink">{erro}</p>}
    </div>
  )
}

/** Select compacto, sem rótulo visível (o do lado do título da página). */
export function SelecaoCompacta({
  rotulo,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string }) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={rotulo}
        className={`h-9 w-full rounded-[3px] border border-borda bg-white px-3 text-sm text-ink outline-none focus:border-acao focus:ring-3 focus:ring-acao/20 ${setaSelect}`}
        {...props}
      >
        {children}
      </select>
      <Seta />
    </div>
  )
}

export function Aviso({ tom, children }: { tom: 'erro' | 'info'; children: ReactNode }) {
  const cores =
    tom === 'erro'
      ? 'bg-negative-bg text-negative-ink border-negative'
      : 'bg-warning-bg text-warning-ink border-ambar'
  return (
    <div role={tom === 'erro' ? 'alert' : 'status'} className={`border-l-4 px-3.5 py-2.5 text-sm ${cores}`}>
      {children}
    </div>
  )
}
