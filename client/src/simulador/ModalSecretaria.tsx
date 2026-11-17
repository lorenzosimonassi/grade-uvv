import { CheckCircle2, Send, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Aviso, Botao } from '../components/ui'
import { api, ErroApi } from '../lib/api'
import { DIAS, hora, mensagemConflito, resumoHorarios, type TurmaNaGrade } from '../lib/horario'
import type { Disciplina, Turma, Usuario } from '../lib/tipos'
import { QuadroSemanal } from './QuadroSemanal'
import type { EstadoTurma, TentativaConflito } from './useSimulador'

interface Props {
  aberto: boolean
  onFechar: () => void
  tentativa: TentativaConflito
  usuario: Usuario
  semestre: string
  grade: TurmaNaGrade[]
  tom: Map<string, number>
  estadoDe: (t: Turma, d: Disciplina) => EstadoTurma
  /** Troca direto para uma turma que cabe, sem precisar da secretaria. */
  onUsarTurma: (t: Turma, d: Disciplina) => void
}

interface Alternativa {
  turma: Turma
  estado: EstadoTurma
}

const nomeDia = (dia: string) => DIAS.find((d) => d.id === dia)?.nome ?? dia

function textoAlternativas(disciplina: Disciplina, alternativas: Alternativa[]): string {
  if (alternativas.length === 0) return `Essa é a única turma de ${disciplina.nome} ofertada neste semestre.`
  const livres = alternativas.filter((a) => a.estado.tipo === 'livre')
  if (livres.length > 0) return ''
  const codigos = alternativas.map((a) => a.turma.codigo).join(', ')
  return `As outras turmas de ${disciplina.nome} (${codigos}) também não cabem na minha grade.`
}

function mensagemInicial(p: Props, alternativas: Alternativa[]): string {
  const { usuario, semestre, tentativa } = p
  const { turma, disciplina, conflito } = tentativa
  const outra = conflito.com
  return [
    'Olá,',
    '',
    `Sou ${usuario.nome}, matrícula ${usuario.matricula}, do ${usuario.periodoAtual}º período de ${usuario.curso.nome}.`,
    '',
    `Ao montar minha grade de ${semestre}, a turma ${turma.codigo} de ${disciplina.nome} (${resumoHorarios(turma.horarios)}) ` +
      `bate com a turma ${outra.turma.codigo} de ${outra.disciplinaNome} (${resumoHorarios(outra.turma.horarios)}), ` +
      `na ${nomeDia(conflito.horario.diaSemana)}, das ${hora(conflito.horario.inicioMin)} às ${hora(conflito.horario.fimMin)}.`,
    textoAlternativas(disciplina, alternativas),
    '',
    'Existe a possibilidade de trocar de turma em alguma das duas disciplinas, ou outra forma de eu conseguir cursar ambas neste semestre?',
    '',
    'Agradeço desde já.',
  ]
    .filter((linha, i, todas) => !(linha === '' && todas[i - 1] === ''))
    .join('\n')
}

function CartaoTurma({ rotulo, nome, turma }: { rotulo: string; nome: string; turma: Turma }) {
  return (
    <div className="min-w-0 flex-1 border border-borda bg-cartao px-4 py-3">
      <p className="text-xs text-muted">{rotulo}</p>
      <p className="truncate text-link">{nome}</p>
      <p className="num text-[13px] text-ink">
        {turma.codigo} · {resumoHorarios(turma.horarios)}
      </p>
      <p className="truncate text-xs text-muted">
        {turma.professor} · {turma.sala}
      </p>
    </div>
  )
}

export function ModalSecretaria(props: Props) {
  const { aberto, onFechar, tentativa, grade, tom, estadoDe, onUsarTurma } = props
  const { turma, disciplina, conflito } = tentativa
  const dialogo = useRef<HTMLDialogElement>(null)

  const alternativas = useMemo<Alternativa[]>(
    () =>
      disciplina.turmas.filter((t) => t.id !== turma.id).map((t) => ({ turma: t, estado: estadoDe(t, disciplina) })),
    [disciplina, turma.id, estadoDe],
  )

  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)

  // Cada vez que abre, recomeça com a mensagem pronta para a tentativa atual.
  useEffect(() => {
    if (!aberto) return
    setMensagem(mensagemInicial(props, alternativas))
    setErro(null)
    setProtocolo(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, turma.id])

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  const enviar = async () => {
    setEnviando(true)
    setErro(null)
    try {
      const r = await api.solicitarSecretaria(turma.id, mensagem)
      setProtocolo(r.protocolo)
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível enviar a solicitação.')
    } finally {
      setEnviando(false)
    }
  }

  const previa = { turma, disciplina, estado: { tipo: 'conflito' as const, conflito } }

  return (
    <dialog
      ref={dialogo}
      onClose={onFechar}
      onClick={(e) => e.target === dialogo.current && onFechar()}
      aria-labelledby="titulo-secretaria"
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[960px] overflow-hidden rounded-[3px] bg-pagina p-0 text-ink shadow-xl backdrop:bg-[#1d2333]/55"
    >
      <div className="flex max-h-[calc(100dvh-32px)] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-borda bg-cartao px-5 py-4">
          <h2 id="titulo-secretaria" className="text-xl font-light text-titulo">
            Enviar para a secretaria online
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="grid size-8 place-items-center rounded-[2px] text-muted hover:bg-chip hover:text-ink"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </header>

        {protocolo ? (
          <div className="flex flex-col items-start gap-4 px-5 py-8 sm:px-8">
            <CheckCircle2 className="size-10 text-positive" aria-hidden />
            <div>
              <p className="text-lg text-titulo">Solicitação enviada</p>
              <p className="mt-1 text-muted">
                A secretaria vai analisar o conflito entre {disciplina.nome} e {conflito.com.disciplinaNome}. Guarde o protocolo:
              </p>
              <p className="num mt-2 inline-block border border-borda bg-cartao px-3 py-1.5 text-titulo select-all">{protocolo}</p>
            </div>
            <Botao onClick={onFechar}>Fechar</Botao>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-6">
              <section aria-labelledby="sec-quadro" className="flex flex-col gap-2">
                <h3 id="sec-quadro" className="text-[15px] text-titulo">
                  Como ficou seu quadro
                </h3>
                <figure className="border border-borda bg-white p-3">
                  <QuadroSemanal grade={grade} tom={tom} previa={previa} />
                  <figcaption className="mt-3 text-xs text-muted">
                    Em vermelho, a aula da sua grade que bate com a {turma.codigo} de {disciplina.nome}. Tracejado, os outros
                    horários dessa turma.
                  </figcaption>
                </figure>
              </section>

              <section aria-labelledby="sec-conflito" className="flex flex-col gap-3">
                <h3 id="sec-conflito" className="text-[15px] text-titulo">
                  O conflito
                </h3>
                <p>{mensagemConflito(turma.codigo, disciplina.nome, conflito)}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <CartaoTurma rotulo="Turma que você quer" nome={disciplina.nome} turma={turma} />
                  <CartaoTurma rotulo="Já está na sua grade" nome={conflito.com.disciplinaNome} turma={conflito.com.turma} />
                </div>
              </section>

              <section aria-labelledby="sec-outras" className="flex flex-col gap-2">
                <h3 id="sec-outras" className="text-[15px] text-titulo">
                  Outras turmas de {disciplina.nome}
                </h3>
                {alternativas.length === 0 ? (
                  <p className="text-muted">Esta é a única turma ofertada neste semestre.</p>
                ) : (
                  <ul className="border border-borda bg-cartao">
                    {alternativas.map(({ turma: t, estado }) => (
                      <li key={t.id} className="flex items-center gap-3 border-b border-divisor px-4 py-2.5 last:border-b-0">
                        <span className="min-w-0 flex-1">
                          <span className="num block text-sm text-ink">
                            {t.codigo} · {resumoHorarios(t.horarios)}
                          </span>
                          <span className="block text-xs text-muted">
                            {estado.tipo === 'livre'
                              ? 'Cabe na sua grade'
                              : estado.tipo === 'conflito'
                                ? `Também bate com ${estado.conflito.com.disciplinaNome}`
                                : estado.tipo === 'limite'
                                  ? 'Passaria do limite de carga horária'
                                  : 'Já está na sua grade'}
                          </span>
                        </span>
                        {estado.tipo === 'livre' && (
                          <Botao variante="secundario" onClick={() => onUsarTurma(t, disciplina)}>
                            Usar esta turma
                          </Botao>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {alternativas.some((a) => a.estado.tipo === 'livre') && (
                  <Aviso tom="info">Há turma que cabe na sua grade. Talvez você nem precise da secretaria.</Aviso>
                )}
              </section>

              <section className="flex flex-col gap-1.5">
                <label htmlFor="mensagem-secretaria" className="text-[15px] text-titulo">
                  Mensagem
                </label>
                <p className="text-xs text-muted">Já deixamos um texto pronto. Ajuste o que quiser antes de enviar.</p>
                <textarea
                  id="mensagem-secretaria"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={9}
                  maxLength={2000}
                  className="w-full resize-y rounded-[3px] border border-borda bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-acao focus:ring-3 focus:ring-acao/20"
                />
              </section>

              {erro && <Aviso tom="erro">{erro}</Aviso>}
            </div>

            <footer className="flex justify-end gap-2 border-t border-borda bg-cartao px-5 py-3">
              <Botao variante="secundario" onClick={onFechar}>
                Cancelar
              </Botao>
              <Botao onClick={enviar} disabled={enviando || mensagem.trim().length < 10}>
                <Send className="size-4" aria-hidden />
                {enviando ? 'Enviando…' : 'Enviar solicitação'}
              </Botao>
            </footer>
          </>
        )}
      </div>
    </dialog>
  )
}
