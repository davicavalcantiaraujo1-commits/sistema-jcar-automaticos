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
  cpf?: string
  endereco?: string
  created_at: string
}

export type Veiculo = {
  id: string
  cliente_id: string
  placa: string
  marca: string
  modelo: string
  ano?: string
  cor?: string
  km?: number
  created_at: string
}

export type Peca = {
  id: string
  nome: string
  codigo?: string
  quantidade: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  fornecedor?: string
  localizacao?: string
  created_at: string
}

export type OrdemServico = {
  id: string
  numero_os?: number
  cliente_id: string
  veiculo_id: string
  servico_solicitado: string
  status: string
  data_entrada: string
  data_prevista?: string
  data_conclusao?: string
  valor_total?: number
  observacoes?: string
  created_at: string
  updated_at?: string
}

export type OrdemServicoPeca = {
  id: string
  ordem_servico_id: string
  peca_id: string
  quantidade: number
  created_at: string
}
