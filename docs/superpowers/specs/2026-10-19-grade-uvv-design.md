# grade-uvv — Simulador de grade curricular

**Data:** 2026-10-19
**Status:** rascunho, aguardando aprovação

## 1. Intenção e o porquê

O grade-uvv é um trabalho acadêmico: um simulador de grade em que o aluno escolhe, para um período letivo, a turma de cada disciplina que vai cursar. Ele nasce como uma versão melhor do simulador que a faculdade já usa, que tem três problemas concretos:

1. **Conflito de horário passa despercebido.** O sistema atual deixa o aluno escolher duas turmas que batem horário, e o problema só aparece depois.
2. **Disciplinas pendentes somem.** O sistema só mostra as disciplinas do período atual. Quem adiou uma disciplina não a encontra mais para escolher.
3. **A interface confunde.**

O projeto dá certo quando resolve esses três problemas de forma visível, numa tela limpa e fácil de ler.

## 2. Objetivos

- Login e cadastro de usuário.
- Logo depois do login, o aluno cai direto na tela do simulador.
- Uma sidebar que imita o portal do aluno. Só o item "Simulador de grade" é clicável; os outros aparecem desabilitados.
- Montagem da grade:
  - Lista com as disciplinas do período do aluno **e** as pendentes de períodos anteriores.
  - Ao abrir uma disciplina, aparecem as turmas dela (dias, horários, professor). Cada turma já diz, antes de qualquer clique, se bate horário com algo que está na grade.
  - Passando o mouse numa turma livre, o quadro semanal mostra em tracejado onde ela cairia.
  - Uma turma com conflito **não pode ser adicionada**. Se o aluno tentar, uma mensagem explica com qual disciplina ela bate e em que dia e horário.
  - Disciplina com pré-requisito não cumprido aparece **travada** (cadeado), dizendo qual pré-requisito falta.
  - Existe um limite de carga horária semanal, mostrado numa barra, que não pode ser ultrapassado.
  - Uma turma por disciplina. Escolher outra turma da mesma disciplina substitui a anterior.
  - O aluno pode remover uma turma da grade.
- Dados mockados (seed) cobrindo só o curso de **Ciência da Computação**.

## 3. Fora do escopo (por enquanto)

- **Importar o arquivo de oferta de disciplinas.** É a próxima grande funcionalidade, mas não entra nesta fase. A modelagem de dados deve deixar o caminho aberto para ela (ver seção 6).
- Outros cursos além de Ciência da Computação.
- As outras telas do portal (notas, financeiro etc.).
- Efetivar matrícula de verdade ou integrar com o sistema da faculdade.

## 4. O que tornaria o projeto um fracasso

- Deixar passar conflito de horário, mesmo que só em algum caso de borda (por exemplo, aulas que se encostam).
- Esconder uma disciplina pendente do aluno.
- Uma tela tão confusa quanto a atual: poluída, sem hierarquia, sem respiro.
- Uma tela "enxuta" demais, que esconde informação de que o aluno precisa para decidir.

## 5. Stack e arquitetura (decididas pelo usuário)

- **Linguagem:** TypeScript no front e no back.
- **Front:** React + Vite + Tailwind CSS.
- **Back:** Node + Express, em arquitetura **MVC**.
- **Banco:** PostgreSQL acessado via Prisma.

### Estrutura de pastas (minha decisão)

Monorepo com duas aplicações independentes:

```
grade-uvv/
  client/                 React + Vite + Tailwind
    src/
      pages/              Login, Cadastro, Simulador
      components/         Sidebar, ListaDisciplinas, CardDisciplina, QuadroSemanal, BarraCarga...
      services/           chamadas HTTP à API
      hooks/
      lib/                funções puras (ex.: detecção de conflito para a prévia)
  server/                 Express + Prisma (MVC)
    prisma/
      schema.prisma
      seed.ts             dados mockados de Ciência da Computação
    src/
      models/             acesso a dados (sobre o Prisma Client)
      controllers/        recebem a requisição, validam, chamam services, respondem
      services/           regras de negócio (conflito, pré-requisito, limite de carga)
      routes/
      middlewares/        autenticação, tratamento de erros
      app.ts / server.ts
  docs/
```

No MVC deste projeto, a "View" é o client React consumindo a API JSON. O server tem Models, Controllers e Rotas, mais uma camada de services para as regras de negócio. **Minha decisão:** separar os services evita que os controllers fiquem gordos.

## 6. Modelo de dados (minha proposta)

- **Usuario**: id, nome, email (único), senhaHash, matricula, cursoId, periodoAtual.
- **Curso**: id, nome, codigo.
- **Disciplina**: id, codigo, nome, cargaHorariaSemanal, periodo (período ideal na matriz), cursoId.
- **PreRequisito**: disciplinaId → requisitoId (uma disciplina pode ter vários).
- **Turma**: id, codigo no padrão da UVV (CC4M = 4º período matutino, CC6N = 6º noturno; nos primeiros períodos a turma é dividida, ex.: CC1M e CC1Mb), disciplinaId, professor, sala, semestreLetivo (ex.: "2027/1").
- **HorarioAula**: id, turmaId, diaSemana (seg–sáb), horaInicio, horaFim (uma turma tem vários).
- **HistoricoItem**: usuarioId, disciplinaId, status (`APROVADO` | `REPROVADO` | `ADIADO` | `TRANCADO`).
- **Simulacao**: id, usuarioId, semestreLetivo. Contém as **SimulacaoTurma** (simulacaoId, turmaId).

A oferta do semestre é representada por **Turma** + **HorarioAula**. É exatamente isso que a futura importação do arquivo de oferta vai preencher, então o resto do sistema não precisa mudar quando ela chegar.

## 7. Regras de negócio

- **Disciplinas exibidas:** as do `periodoAtual` do aluno, mais as **pendentes**: disciplinas de períodos anteriores que o aluno não tem como `APROVADO`. Disciplinas já aprovadas não aparecem.
- **Pré-requisito:** a disciplina fica travada se algum dos seus requisitos não estiver `APROVADO` no histórico.
- **Conflito:** duas turmas conflitam se têm algum horário no mesmo dia em que `inicioA < fimB && inicioB < fimA`. Aulas que só se encostam (uma termina 21:00 e a outra começa 21:00) **não** conflitam.
- **Limite de carga:** a soma da `cargaHorariaSemanal` das disciplinas na grade não pode passar do limite. **Minha decisão:** 24h semanais como valor padrão, configurável.
- **Onde as regras rodam:** o **back-end é a fonte da verdade** e recusa a operação com uma mensagem clara. O front repete a detecção de conflito só para a prévia visual (turma marcada em vermelho, tracejado no quadro).
- **Persistência:** a simulação fica salva no banco por usuário e semestre. Ao voltar, o aluno encontra a grade como deixou. **Minha decisão:** salvar automaticamente a cada mudança, sem botão de salvar.
- **Troca de turma:** quando o aluno troca a turma de uma disciplina, a turma atual dela é ignorada na checagem de conflito e de carga. **Minha decisão.**
- **Pendente sem turma ofertada:** aparece na lista marcada como "sem turmas no semestre" e nunca é escondida. **Minha decisão.**
- **Semestre:** existe um único semestre letivo ativo (ex.: "2027/1"), definido por configuração. Não há seletor de semestre. O campo `semestreLetivo` continua no modelo para a futura importação de oferta. **Minha decisão.**
- **Limite de carga:** configurado por variável de ambiente no server. **Minha decisão.**

## 7.1 Execução (minha decisão)

O projeto roda localmente. O Postgres sobe via Docker Compose, e há um `.env.example` em cada app. O client e o server rodam com scripts de dev, e há instruções no README para migrar o banco e rodar o seed.

## 8. Autenticação (minha decisão)

- Cadastro com nome, email, matrícula, período atual e senha. A senha é guardada com hash (bcrypt).
- Login com email e senha. O back devolve um JWT que o front envia no header `Authorization`.
- Todas as rotas do simulador exigem autenticação.
- **Histórico de quem se cadastra (decidido com o usuário):** o cadastro também pede o **período atual** (curso fixo: Ciência da Computação). Ao criar a conta, o back gera um histórico mockado coerente com aquele período: as disciplinas dos períodos anteriores ficam quase todas como `APROVADO`, com **pelo menos uma pendente** (`ADIADO` ou `REPROVADO`) e o histórico montado para que **pelo menos uma disciplina do período atual fique travada** por pré-requisito. Os modelos de histórico por período ficam definidos no seed ou numa fixture do server. Para alunos do 1º período, que não têm períodos anteriores, não há pendências, e isso é aceitável.
- O seed também cria um **aluno de demonstração** já pronto (com email e senha documentados no README), para testar sem precisar se cadastrar.

## 9. Tela (aprovada no mockup v2)

O mockup aprovado está em `.superpowers/brainstorm/.../content/layout-v2.html`.

- **Sidebar escura** à esquerda, imitando o portal: itens desabilitados, "Simulador de grade" ativo, cartão do aluno no rodapé (nome, curso, período).
- **Topo:** título, semestre letivo e barra de carga horária ("16h de 24h").
- **Coluna esquerda (lista):** busca, filtros (Todas, Do período, Pendentes, Na grade), grupo "Pendentes" no topo com marcação âmbar e, em seguida, o grupo do período atual. Cada disciplina mostra carga, número de turmas e status (na grade / escolher / bloqueada). Ao abrir, ela expande as turmas com o status de conflito de cada uma.
- **Coluna direita:** quadro semanal de segunda a sexta (sábado só aparece se a oferta tiver aula no sábado), com blocos coloridos por disciplina, prévia tracejada no hover e a mensagem de bloqueio quando aparece.
- **Visual:** limpo, com respiro e hierarquia clara. As cores do mockup são provisórias.

## 10. Deixado para quem for construir

- Bibliotecas auxiliares: roteamento no front, validação (por exemplo, zod), cliente HTTP, gerenciamento de estado.
- Paleta final, tipografia e detalhes visuais, dentro do espírito do mockup.
- Faixa de horários mostrada no quadro.
- Conteúdo exato do seed. Ele deve ser verossímil para Ciência da Computação: vários períodos, pré-requisitos encadeados, mais de uma turma por disciplina, alguns conflitos propositais e pelo menos uma disciplina pendente e uma travada no aluno de exemplo.
- Ferramentas de lint, formatação e testes.

## 11. Em aberto

- **Exigências da disciplina** (prazo, critérios de avaliação, deploy, testes obrigatórios) não foram informadas. O plano assume que não há nenhuma além deste documento. Testes automatizados cobrem pelo menos as regras de negócio do server (conflito, pré-requisito, pendentes, limite de carga).
