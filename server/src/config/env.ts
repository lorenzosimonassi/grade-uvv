import 'dotenv/config'

function obrigatoria(nome: string): string {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida. Veja server/.env.example.`)
  return valor
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: obrigatoria('JWT_SECRET'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  semestreAtivo: process.env.SEMESTRE_ATIVO ?? '2027/1',
  limiteCargaHoraria: Number(process.env.LIMITE_CARGA_HORARIA ?? 24),
}
