# grade-uvv

Simulador de grade curricular: o aluno escolhe uma turma por disciplina e vê a semana montada, sem conflito de horário.
Projeto acadêmico, com dados mockados do curso de Ciência da Computação.

- Conflito de horário é avisado **antes** de escolher e bloqueado na hora.
- Disciplinas pendentes (reprovadas ou adiadas) aparecem junto com as do período.
- Disciplina com pré-requisito não cumprido aparece travada, dizendo o que falta.
- Limite de carga horária semanal (padrão 24h).

O design completo está em [`docs/superpowers/specs/2026-10-19-grade-uvv-design.md`](docs/superpowers/specs/2026-10-19-grade-uvv-design.md).

## Stack

| Parte | Tecnologias |
| --- | --- |
| `client/` | React 19, Vite, Tailwind CSS v4, React Router, TypeScript |
| `server/` | Node, Express 5 (MVC: models, controllers, rotas e services), Prisma, PostgreSQL, TypeScript |

## Como rodar

Requisitos: Node 20+, Docker (para o Postgres).

```bash
npm install                    # instala client e server (workspaces)
cp server/.env.example server/.env
npm run db:up                  # sobe o Postgres na porta 5433
npm run db:setup               # cria as tabelas e roda o seed (com o dev parado)
npm run dev                    # API em :3333 e front em :5173
```

Abra http://localhost:5173.

**Conta padrão** (4º período, com pendências e uma disciplina travada):

- matrícula: `202306209`
- senha: `123`

Ou crie uma conta: o histórico mockado é gerado a partir do período informado no cadastro.

## Scripts úteis

| Comando | O que faz |
| --- | --- |
| `npm test` | Testes das regras de negócio (conflito, pré-requisito, pendências, carga) |
| `npm run db:reset -w server` | Recria o banco do zero e roda o seed de novo |
| `npm run build` | Compila server e client |

## Estrutura

```
client/src/
  pages/        Login, Cadastro e Simulador
  components/   AppShell (sidebar do portal), AuthLayout, ui
  simulador/    lista de disciplinas, quadro semanal, hook de estado
  lib/          API, autenticação, regras de horário para a prévia
server/
  prisma/       schema e seed
  src/
    models/       acesso a dados (Prisma)
    controllers/  validação da requisição e resposta
    services/     regras de negócio (regras.ts é puro e testado)
    routes/       rotas da API
    middlewares/  autenticação e tratamento de erros
    data/         matriz curricular, oferta e históricos mockados
```

## API

| Método | Rota | |
| --- | --- | --- |
| POST | `/api/auth/cadastro` | nome, email, matrícula, período atual, senha |
| POST | `/api/auth/login` | matrícula, senha |
| GET | `/api/auth/me` | perfil do usuário logado |
| GET | `/api/simulador` | disciplinas visíveis, turmas, grade atual e carga |
| PUT | `/api/simulador/turmas/:turmaId` | adiciona (ou troca) a turma; 409 em conflito, 422 em pré-requisito/limite |
| DELETE | `/api/simulador/turmas/:turmaId` | remove a turma |
| DELETE | `/api/simulador/turmas` | limpa a grade |

## Próximos passos

- Importar o arquivo de oferta de disciplinas: ele substitui `server/src/data/oferta.ts` e preenche `Turma` e `HorarioAula`.
