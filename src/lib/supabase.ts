import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para o banco de dados
export type Cliente = {
  id: string
  nome: string
  telefone: string
  email?: string
  endereco?: string
  created_at: string
}

export type Veiculo = {
  id: string
  cliente_id: string
  placa: string
  marca: string
  modelo: string
  ano?: number
  created_at: string
}

export type Mecanico = {
  id: string
  nome: string
  created_at: string
}

export type OrdemServico = {
  id: string
  numero_os?: number
  cliente_id: string
  veiculo_id: string
  mecanico_id?: string
  servico_solicitado: string
  descricao?: string
  orcamento_estimado?: number
  pecas_gastas?: string
  status: string
  data_entrada: string
  data_prevista?: string
  data_finalizacao?: string
  valor_total?: number
  created_at: string
  updated_at?: string
}

export type ItemOrcamento = {
  id: string
  os_id: string
  tipo: 'peca' | 'mao_obra'
  descricao: string
  quantidade: number
  valor_unitario: number
  subtotal: number
  created_at: string
}

export type Estoque = {
  id: string
  nome: string
  codigo: string
  quantidade: number
  minimo: number
  fornecedor?: string
  preco_compra: number
  preco_venda: number
  created_at: string
  updated_at: string
}

export type HistoricoOS = {
  id: string
  os_id: string
  status_anterior: string
  status_novo: string
  observacao?: string
  usuario?: string
  created_at: string
}
