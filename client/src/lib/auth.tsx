import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, definirToken, tokenStorage, type RespostaAuth } from './api'
import type { Usuario } from './tipos'

interface AuthCtx {
  usuario: Usuario | null
  carregando: boolean
  entrar: (matricula: string, senha: string) => Promise<void>
  cadastrar: (dados: Parameters<typeof api.cadastrar>[0]) => Promise<void>
  sair: () => void
}

const Contexto = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(() => Boolean(tokenStorage.ler()))

  useEffect(() => {
    if (!tokenStorage.ler()) return
    api
      .perfil()
      .then(setUsuario)
      .catch(() => definirToken(null))
      .finally(() => setCarregando(false))
  }, [])

  const aplicar = useCallback(({ token, usuario }: RespostaAuth) => {
    definirToken(token)
    setUsuario(usuario)
  }, [])

  const valor = useMemo<AuthCtx>(
    () => ({
      usuario,
      carregando,
      entrar: async (matricula, senha) => aplicar(await api.entrar(matricula, senha)),
      cadastrar: async (dados) => aplicar(await api.cadastrar(dados)),
      sair: () => {
        definirToken(null)
        setUsuario(null)
      },
    }),
    [usuario, carregando, aplicar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
