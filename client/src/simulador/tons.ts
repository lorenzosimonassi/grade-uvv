// Classes literais para o Tailwind encontrar: tom pálido de fundo + borda à esquerda.
export const TOM_BLOCO: Record<number, string> = {
  1: 'bg-d1 border-d1-edge',
  2: 'bg-d2 border-d2-edge',
  3: 'bg-d3 border-d3-edge',
  4: 'bg-d4 border-d4-edge',
  5: 'bg-d5 border-d5-edge',
  6: 'bg-d6 border-d6-edge',
  7: 'bg-d7 border-d7-edge',
}

/** Os mesmos tons do index.css, em hex, para o PDF (que não enxerga as classes do Tailwind). */
export const TOM_HEX: Record<number, { fundo: string; borda: string }> = {
  1: { fundo: '#dcebf6', borda: '#3c8dbc' },
  2: { fundo: '#e3e6f7', borda: '#4a5bb5' },
  3: { fundo: '#f8ecd2', borda: '#c7880f' },
  4: { fundo: '#dff2e5', borda: '#2e8b57' },
  5: { fundo: '#f8e1e4', borda: '#b23a4c' },
  6: { fundo: '#e7e9ec', borda: '#4f5862' },
  7: { fundo: '#ece4f5', borda: '#7652a8' },
}

export const TOM_PONTO: Record<number, string> = {
  1: 'bg-d1-edge',
  2: 'bg-d2-edge',
  3: 'bg-d3-edge',
  4: 'bg-d4-edge',
  5: 'bg-d5-edge',
  6: 'bg-d6-edge',
  7: 'bg-d7-edge',
}
