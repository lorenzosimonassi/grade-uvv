import { jsPDF } from 'jspdf'
import { autoTable, type CellDef, type CellHookData, type RowInput } from 'jspdf-autotable'
import { DIAS, hora, resumoHorarios, type TurmaNaGrade } from '../lib/horario'
import type { Dia, Usuario } from '../lib/tipos'
import { TOM_HEX } from './tons'

// Gera o quadro de horários da grade montada como PDF (A4 deitado), direto no navegador.

const NOME_DIA: Record<Dia, string> = {
  SEG: 'Segunda',
  TER: 'Terça',
  QUA: 'Quarta',
  QUI: 'Quinta',
  SEX: 'Sexta',
  SAB: 'Sábado',
}

/** Buraco entre duas aulas que ainda conta como intervalo; acima disso é troca de turno. */
const INTERVALO_MAX = 30

const COR = {
  marinho: '#1d3b6e',
  ink: '#333a44',
  muted: '#7a828c',
  titulo: '#555b63',
  borda: '#dcdfe3',
  divisor: '#eef0f2',
  chip: '#f6f6f7',
}

export type LinhaQuadro =
  | { tipo: 'aulas'; inicio: number; fim: number; celulas: (TurmaNaGrade | null)[] }
  | { tipo: 'intervalo'; inicio: number; fim: number }

/**
 * Monta o quadro: uma linha por horário de aula usado na grade, uma coluna por dia
 * (sábado só se tiver aula). Cada horário é uma célula, mesmo nas aulas duplas.
 */
export function montarQuadro(grade: TurmaNaGrade[]): { dias: Dia[]; linhas: LinhaQuadro[] } {
  const horarios = grade.flatMap((g) => g.turma.horarios.map((h) => ({ ...h, g })))
  const dias = DIAS.map((d) => d.id).filter((d) => d !== 'SAB' || horarios.some((h) => h.diaSemana === 'SAB'))

  const faixas = [...new Map(horarios.map((h) => [`${h.inicioMin}-${h.fimMin}`, h])).values()]
    .map((h) => ({ inicio: h.inicioMin, fim: h.fimMin }))
    .sort((a, b) => a.inicio - b.inicio || a.fim - b.fim)

  const linhas: LinhaQuadro[] = []
  for (const f of faixas) {
    const anterior = linhas.at(-1)
    const buraco = anterior ? f.inicio - anterior.fim : 0
    if (anterior && buraco > 0 && buraco <= INTERVALO_MAX) linhas.push({ tipo: 'intervalo', inicio: anterior.fim, fim: f.inicio })

    const celulas = dias.map(
      (dia) => horarios.find((x) => x.diaSemana === dia && x.inicioMin === f.inicio && x.fimMin === f.fim)?.g ?? null,
    )
    linhas.push({ tipo: 'aulas', inicio: f.inicio, fim: f.fim, celulas })
  }

  return { dias, linhas }
}

async function carregarLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch('/imgs/logo-uvv.png')).blob()
    return await new Promise((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(leitor.result as string)
      leitor.onerror = reject
      leitor.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

interface Dados {
  usuario: Usuario
  semestre: string
  grade: TurmaNaGrade[]
  tom: Map<string, number>
  cargaDe: (disciplinaId: string) => number
  cargaAtual: number
  limite: number
}

export async function gerarGradePdf({ usuario, semestre, grade, tom, cargaDe, cargaAtual, limite }: Dados): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  const margem = 14
  const tomDe = (g: TurmaNaGrade) => TOM_HEX[tom.get(g.disciplinaId) ?? 1]

  // Cabeçalho: logo à esquerda, título à direita, aluno embaixo.
  const logo = await carregarLogo()
  if (logo) doc.addImage(logo, 'PNG', margem, 10, 36, (36 * 54) / 168)

  doc.setFont('helvetica', 'normal').setFontSize(18).setTextColor(COR.marinho)
  doc.text('Quadro de Horários', largura - margem, 16, { align: 'right' })
  doc.setFontSize(9).setTextColor(COR.muted)
  doc.text(`Semestre ${semestre} · ${usuario.periodoAtual}º período`, largura - margem, 21.5, { align: 'right' })

  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(COR.ink)
  doc.text(usuario.nome, margem, 30)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(COR.muted)
  doc.text(`Matrícula ${usuario.matricula} · ${usuario.curso.nome}`, margem, 35)
  doc.text(`Carga horária semanal: ${cargaAtual}h de ${limite}h`, largura - margem, 35, { align: 'right' })

  doc.setDrawColor(COR.borda).setLineWidth(0.3).line(margem, 39, largura - margem, 39)

  // Quadro semanal.
  const { dias, linhas } = montarQuadro(grade)
  const larguraHorario = 26
  const larguraDia = (largura - 2 * margem - larguraHorario) / dias.length
  const aulaDaCelula = new Map<string, TurmaNaGrade>()

  const corpo: RowInput[] = linhas.map((l, i) => {
    const faixa = `${hora(l.inicio)} – ${hora(l.fim)}`
    if (l.tipo === 'intervalo') {
      return [
        { content: faixa, styles: { fontSize: 7, textColor: COR.muted, cellPadding: 0.8, minCellHeight: 0 } },
        {
          content: 'Intervalo',
          colSpan: dias.length,
          styles: { fontSize: 7, fontStyle: 'italic', textColor: COR.muted, fillColor: COR.divisor, cellPadding: 0.8, minCellHeight: 0 },
        },
      ]
    }
    const celulas: CellDef[] = [{ content: faixa }]
    l.celulas.forEach((aula, j) => {
      if (!aula) return void celulas.push({ content: '' })
      aulaDaCelula.set(`${i}-${j + 1}`, aula)
      celulas.push({
        content: `${aula.disciplinaNome}\n${aula.turma.codigo}`,
        styles: { fontStyle: 'bold', fillColor: tomDe(aula).fundo },
      })
    })
    return celulas
  })

  autoTable(doc, {
    startY: 44,
    margin: { left: margem, right: margem },
    head: [['Horário', ...dias.map((d) => NOME_DIA[d])]],
    body: grade.length ? corpo : [[{ content: 'Nenhuma turma na grade.', colSpan: dias.length + 1 }]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 1.8, bottom: 1.8, left: 3.5, right: 2.5 },
      lineColor: COR.borda,
      lineWidth: 0.2,
      textColor: COR.ink,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 8,
    },
    headStyles: { fillColor: COR.marinho, textColor: '#ffffff', fontStyle: 'bold', fontSize: 9, minCellHeight: 7.5 },
    columnStyles: {
      0: { cellWidth: larguraHorario, fillColor: COR.chip, textColor: COR.titulo },
      ...Object.fromEntries(dias.map((_, i) => [i + 1, { cellWidth: larguraDia }])),
    },
    willDrawCell: (data: CellHookData) => {
      const aula = data.section === 'body' && aulaDaCelula.get(`${data.row.index}-${data.column.index}`)
      if (!aula) return
      // Desenho próprio: faixa colorida à esquerda, nome em negrito e turma em cinza.
      const { cell, doc } = data
      const { fundo, borda } = tomDe(aula)
      doc.setFillColor(fundo).setDrawColor(COR.borda).setLineWidth(0.2)
      doc.rect(cell.x, cell.y, cell.width, cell.height, 'FD')
      doc.setFillColor(borda).rect(cell.x, cell.y, 1.2, cell.height, 'F')

      const linhasTexto = cell.text as string[]
      const alturaLinha = (cell.styles.fontSize / doc.internal.scaleFactor) * doc.getLineHeightFactor()
      let y = cell.y + (cell.height - linhasTexto.length * alturaLinha) / 2
      const x = cell.x + 0.6 + cell.width / 2
      linhasTexto.forEach((t, k) => {
        const meta = k === linhasTexto.length - 1
        doc.setFont('helvetica', meta ? 'normal' : 'bold').setFontSize(meta ? 7 : 8)
        doc.setTextColor(meta ? COR.muted : COR.ink)
        doc.text(t, x, y, { align: 'center', baseline: 'top' })
        y += alturaLinha
      })
      return false
    },
  })

  // Lista das disciplinas, com os horários resumidos e a carga de cada uma.
  if (grade.length) {
    const fimQuadro = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    autoTable(doc, {
      startY: fimQuadro + 6,
      rowPageBreak: 'avoid',
      margin: { left: margem, right: margem },
      head: [['', 'Disciplina', 'Turma', 'Horários', 'CH']],
      body: grade.map((g) => [
        '',
        g.disciplinaNome,
        g.turma.codigo,
        resumoHorarios(g.turma.horarios),
        `${cargaDe(g.disciplinaId)}h`,
      ]),
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 }, textColor: COR.ink },
      headStyles: { textColor: COR.muted, fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 6 }, 2: { cellWidth: 24 }, 4: { cellWidth: 12, halign: 'right' } },
      didDrawCell: (data: CellHookData) => {
        const { cell, doc } = data
        doc.setDrawColor(data.section === 'head' ? COR.borda : COR.divisor).setLineWidth(0.2)
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height)
        if (data.section === 'body' && data.column.index === 0) {
          doc.setFillColor(tomDe(grade[data.row.index]).borda)
          doc.circle(cell.x + cell.width / 2 + 0.5, cell.y + cell.height / 2, 1.3, 'F')
        }
      },
    })
  }

  // Rodapé em todas as páginas.
  const agora = new Date()
  const gerado = `Gerado em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(COR.muted)
    doc.text(`${gerado} · Simulador de Grade UVV`, margem, altura - 8)
    if (paginas > 1) doc.text(`${p}/${paginas}`, largura - margem, altura - 8, { align: 'right' })
  }

  return doc
}

export async function exportarGradePdf(dados: Dados) {
  const doc = await gerarGradePdf(dados)
  doc.save(`grade-${dados.semestre.replace(/\W+/g, '-')}.pdf`)
}
