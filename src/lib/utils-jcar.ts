// Constantes e utilitários para o sistema JCAR

export const MECANICOS = ['Wellington', 'João Carlos', 'Germano']

export const SERVICOS_OFICINA = [
  'Troca de óleo',
  'Troca de filtro de ar',
  'Troca de filtro de combustível',
  'Revisão completa',
  'Alinhamento e balanceamento',
  'Troca de pastilhas de freio',
  'Troca de amortecedor',
  'Vazamento de óleo',
  'Vazamento na caixa de marcha',
  'Diagnóstico eletrônico',
  'Troca da correia dentada',
  'Problemas de injeção eletrônica',
  'Falha de combustível',
  'Motor falhando',
  'Superaquecimento',
  'Limpador de para-brisa com defeito',
  'Ruído na suspensão',
  'Troca de embreagem',
  'Troca de bateria',
  'Troca de cabo de vela',
  'Troca de bobina',
  'Troca de termostato',
  'Troca de bomba d\'água',
  'Revisão de freios',
  'Limpeza de bicos',
  'Pane elétrica'
]

export const STATUS_OS = {
  a_receber: { label: 'A Receber', color: 'bg-yellow-500' },
  aguardando_aprovacao: { label: 'Aguardando Aprovação', color: 'bg-orange-500' },
  aguardando_peca: { label: 'Aguardando Peça', color: 'bg-purple-500' },
  em_execucao: { label: 'Em Execução', color: 'bg-blue-500' },
  finalizado: { label: 'Finalizado', color: 'bg-green-500' },
  pronto_retirada: { label: 'Pronto para Retirada', color: 'bg-teal-500' }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatPlaca(placa: string): string {
  // Remove caracteres não alfanuméricos
  const cleaned = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  
  // Formato Mercosul: ABC1D23
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}${cleaned.slice(4)}`
  }
  
  // Formato antigo: ABC-1234
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }
  
  return placa
}
