/** Erro de negócio com status HTTP e mensagem pronta para o aluno ler. */
export class ErroApp extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly codigo?: string,
  ) {
    super(message)
  }
}
