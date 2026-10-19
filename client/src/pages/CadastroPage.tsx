import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { Aviso, Botao, Campo, Selecao } from '../components/ui'
import { ErroApi } from '../lib/api'
import { useAuth } from '../lib/auth'

const PERIODOS = Array.from({ length: 8 }, (_, i) => i + 1)

export function CadastroPage() {
  const { cadastrar } = useAuth()
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setErro(null)
    setErros({})

    if (form.get('senha') !== form.get('confirmacao')) {
      setErros({ confirmacao: 'As senhas não são iguais.' })
      return
    }

    setEnviando(true)
    try {
      await cadastrar({
        nome: String(form.get('nome')),
        email: String(form.get('email')),
        matricula: String(form.get('matricula')),
        periodoAtual: Number(form.get('periodoAtual')),
        senha: String(form.get('senha')),
      })
      navegar('/simulador', { replace: true })
    } catch (err) {
      if (err instanceof ErroApi && err.campos?.length) {
        setErros(Object.fromEntries(err.campos.map((c) => [c.campo, c.mensagem])))
      } else {
        setErro(err instanceof ErroApi ? err.message : 'Não foi possível criar a conta agora.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-[26px] leading-tight font-light text-titulo">Crie sua conta</h1>
      <p className="mt-1.5 text-muted">Seu histórico de Ciência da Computação é montado a partir do período que você informar.</p>

      <form onSubmit={enviar} className="mt-7 flex flex-col gap-4" noValidate>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
        <Campo rotulo="Nome completo" name="nome" autoComplete="name" required erro={erros.nome} autoFocus />
        <Campo rotulo="Email" name="email" type="email" autoComplete="email" required erro={erros.email} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_150px]">
          <Campo
            rotulo="Matrícula"
            name="matricula"
            inputMode="numeric"
            required
            erro={erros.matricula}
            placeholder="202400123"
          />
          <Selecao rotulo="Período atual" name="periodoAtual" defaultValue="" required erro={erros.periodoAtual}>
            <option value="" disabled>
              Escolha
            </option>
            {PERIODOS.map((p) => (
              <option key={p} value={p}>
                {p}º período
              </option>
            ))}
          </Selecao>
        </div>
        <Campo
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          erro={erros.senha}
          dica="Pelo menos 8 caracteres."
        />
        <Campo
          rotulo="Confirme a senha"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          erro={erros.confirmacao}
        />
        <Botao type="submit" disabled={enviando} className="mt-2 h-10">
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </Botao>
      </form>

      <p className="mt-6 text-muted">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-semibold text-link hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
