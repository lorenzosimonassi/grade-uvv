import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { Aviso, Botao, Campo } from '../components/ui'
import { ErroApi } from '../lib/api'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { entrar } = useAuth()
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setErro(null)
    setEnviando(true)
    try {
      await entrar(String(form.get('matricula')), String(form.get('senha')))
      navegar('/simulador', { replace: true })
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : 'Não foi possível entrar agora.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-[26px] leading-tight font-light text-titulo">Entre na sua conta</h1>
      <p className="mt-1.5 text-muted">Use sua matrícula e a senha que você cadastrou.</p>

      <form onSubmit={enviar} className="mt-7 flex flex-col gap-4" noValidate>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
        <Campo rotulo="Matrícula" name="matricula" inputMode="numeric" autoComplete="username" required autoFocus />
        <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
        <Botao type="submit" disabled={enviando} className="mt-2 h-10">
          {enviando ? 'Entrando…' : 'Entrar'}
        </Botao>
      </form>

      <p className="mt-6 text-muted">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-link hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  )
}
