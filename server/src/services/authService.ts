import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { CURSO_CC } from '../data/curriculo.js'
import { gerarHistorico } from '../data/historico.js'
import { ErroApp } from '../lib/erros.js'
import { cursoModel } from '../models/cursoModel.js'
import { disciplinaModel } from '../models/disciplinaModel.js'
import { usuarioModel, type UsuarioPublico } from '../models/usuarioModel.js'

const EXPIRACAO = '7d'

function emitirToken(usuarioId: string) {
  return jwt.sign({ sub: usuarioId }, env.jwtSecret, { expiresIn: EXPIRACAO })
}

export function verificarToken(token: string): string {
  const payload = jwt.verify(token, env.jwtSecret)
  if (typeof payload === 'string' || !payload.sub) throw new Error('token inválido')
  return payload.sub
}

export interface DadosCadastro {
  nome: string
  email: string
  matricula: string
  periodoAtual: number
  senha: string
}

export const authService = {
  async cadastrar(dados: DadosCadastro): Promise<{ token: string; usuario: UsuarioPublico }> {
    const existente = await usuarioModel.existeEmailOuMatricula(dados.email, dados.matricula)
    if (existente) {
      const campo = existente.email === dados.email ? 'Este email' : 'Esta matrícula'
      throw new ErroApp(409, `${campo} já está cadastrado. Entre com sua conta.`)
    }

    const curso = await cursoModel.buscarPorCodigo(CURSO_CC.codigo)
    if (!curso) throw new ErroApp(500, 'O curso não foi encontrado. Rode o seed do banco (npm run db:setup).')

    const modelo = gerarHistorico(dados.periodoAtual)
    const disciplinas = await disciplinaModel.listarPorCodigos(
      curso.id,
      modelo.map((m) => m.codigo),
    )
    const idPorCodigo = new Map(disciplinas.map((d) => [d.codigo, d.id]))

    const usuario = await usuarioModel.criarComHistorico({
      nome: dados.nome,
      email: dados.email,
      matricula: dados.matricula,
      periodoAtual: dados.periodoAtual,
      senhaHash: await bcrypt.hash(dados.senha, 10),
      cursoId: curso.id,
      historico: modelo.map((m) => ({ disciplinaId: idPorCodigo.get(m.codigo)!, status: m.status })),
    })

    return { token: emitirToken(usuario.id), usuario }
  },

  async entrar(email: string, senha: string): Promise<{ token: string; usuario: UsuarioPublico }> {
    const registro = await usuarioModel.buscarPorEmail(email)
    const senhaConfere = registro ? await bcrypt.compare(senha, registro.senhaHash) : false
    if (!registro || !senhaConfere) throw new ErroApp(401, 'Email ou senha incorretos.')

    const usuario = (await usuarioModel.buscarPublicoPorId(registro.id))!
    return { token: emitirToken(usuario.id), usuario }
  },

  async perfil(usuarioId: string): Promise<UsuarioPublico> {
    const usuario = await usuarioModel.buscarPublicoPorId(usuarioId)
    if (!usuario) throw new ErroApp(401, 'Sua sessão expirou. Entre novamente.')
    return usuario
  },
}
