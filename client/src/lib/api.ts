import type { Usuario, VisaoSimulador } from './tipos'

const CHAVE_TOKEN = 'grade-uvv:token'

export const tokenStorage = {
  ler(): string | null {
    try {
      return localStorage.getItem(CHAVE_TOKEN)
    } catch {
      return null
    }
  },
  salvar(token: string) {
    try {
      localStorage.setItem(CHAVE_TOKEN, token)
    } catch {
      /* sem storage: a sessão dura só esta aba */
    }
  },
  limpar() {
    try {
      localStorage.removeItem(CHAVE_TOKEN)
    } catch {
      /* idem */
    }
  },
}

export class ErroApi extends Error {
  constructor(
    public status: number,
    message: string,
    public codigo?: string,
    public campos?: { campo: string; mensagem: string }[],
  ) {
    super(message)
  }
}

let tokenEmMemoria: string | null = tokenStorage.ler()

export function definirToken(token: string | null) {
  tokenEmMemoria = token
  if (token) tokenStorage.salvar(token)
  else tokenStorage.limpar()
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        ...(tokenEmMemoria ? { Authorization: `Bearer ${tokenEmMemoria}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível falar com o servidor. Verifique se a API está rodando.')
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new ErroApi(resposta.status, dados.mensagem ?? 'Algo deu errado.', dados.codigo, dados.campos)
  }
  return dados as T
}

export interface RespostaAuth {
  token: string
  usuario: Usuario
}

export const api = {
  entrar: (matricula: string, senha: string) =>
    requisicao<RespostaAuth>('POST', '/auth/login', { matricula, senha }),
  cadastrar: (dados: { nome: string; email: string; matricula: string; periodoAtual: number; senha: string }) =>
    requisicao<RespostaAuth>('POST', '/auth/cadastro', dados),
  perfil: () => requisicao<Usuario>('GET', '/auth/me'),

  simulador: () => requisicao<VisaoSimulador>('GET', '/simulador'),
  adicionarTurma: (turmaId: string) => requisicao<VisaoSimulador>('PUT', `/simulador/turmas/${turmaId}`),
  removerTurma: (turmaId: string) => requisicao<VisaoSimulador>('DELETE', `/simulador/turmas/${turmaId}`),
  limparGrade: () => requisicao<VisaoSimulador>('DELETE', '/simulador/turmas'),
}
