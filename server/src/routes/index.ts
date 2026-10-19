import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { simuladorController } from '../controllers/simuladorController.js'
import { autenticar } from '../middlewares/autenticar.js'

// Express 5 repassa erros de handlers async para o tratarErros automaticamente.
export const rotas = Router()

rotas.post('/auth/cadastro', authController.cadastrar)
rotas.post('/auth/login', authController.entrar)
rotas.get('/auth/me', autenticar, authController.perfil)

rotas.get('/simulador', autenticar, simuladorController.obter)
rotas.put('/simulador/turmas/:turmaId', autenticar, simuladorController.adicionarTurma)
rotas.delete('/simulador/turmas/:turmaId', autenticar, simuladorController.removerTurma)
rotas.delete('/simulador/turmas', autenticar, simuladorController.limpar)
