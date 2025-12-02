'use client'

import { useState, useEffect } from 'react'
import { supabase, type Cliente, type Veiculo } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SERVICOS_OFICINA } from '@/lib/utils-jcar'
import { toast } from 'sonner'
import { Loader2, Search, X, UserPlus, Car } from 'lucide-react'

interface NovaOSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  osId?: string // Para edição
}

// Lista fixa de mecânicos
const MECANICOS_FIXOS = [
  'Wellington',
  'João Carlos',
  'Germano'
]

export default function NovaOSDialog({ open, onOpenChange, onSuccess, osId }: NovaOSDialogProps) {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServicos, setSelectedServicos] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('buscar-cliente')
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    veiculo_id: '',
    mecanico_responsavel: '',
    servico_solicitado: '',
    descricao: '',
    data_prevista: '',
    orcamento_estimado: '',
    pecas_gastas: '',
    status: 'A Receber'
  })

  // Dados para cadastro de novo cliente
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    endereco: ''
  })

  // Dados para cadastro de novo veículo
  const [novoVeiculo, setNovoVeiculo] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    cor: '',
    km: ''
  })

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null)

  useEffect(() => {
    if (open) {
      if (osId) {
        loadOS(osId)
      } else {
        resetForm()
      }
    }
  }, [open, osId])

  useEffect(() => {
    if (formData.cliente_id) {
      loadVeiculos(formData.cliente_id)
    } else {
      setVeiculos([])
      setVeiculoSelecionado(null)
    }
  }, [formData.cliente_id])

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      veiculo_id: '',
      mecanico_responsavel: '',
      servico_solicitado: '',
      descricao: '',
      data_prevista: '',
      orcamento_estimado: '',
      pecas_gastas: '',
      status: 'A Receber'
    })
    setNovoCliente({
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      endereco: ''
    })
    setNovoVeiculo({
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      cor: '',
      km: ''
    })
    setClienteSelecionado(null)
    setVeiculoSelecionado(null)
    setSelectedServicos([])
    setSearchTerm('')
    setClientes([])
    setActiveTab('buscar-cliente')
  }

  const loadOS = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('ordem_servico')
        .select(`
          *,
          clientes (*),
          veiculos (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          cliente_id: data.cliente_id,
          veiculo_id: data.veiculo_id || '',
          mecanico_responsavel: data.mecanico_responsavel || '',
          servico_solicitado: data.servico_solicitado || '',
          descricao: data.descricao || '',
          data_prevista: data.data_prevista || '',
          orcamento_estimado: data.orcamento_estimado?.toString() || '',
          pecas_gastas: data.pecas_gastas || '',
          status: data.status || 'A Receber'
        })
        setClienteSelecionado(data.clientes)
        setVeiculoSelecionado(data.veiculos)
        
        // Carregar serviços selecionados
        if (data.servico_solicitado) {
          const servicos = data.servico_solicitado.split(', ')
          setSelectedServicos(servicos)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar OS:', error)
      toast.error('Erro ao carregar ordem de serviço')
    }
  }

  const searchClientes = async (term: string) => {
    if (!term || term.length < 2) {
      setClientes([])
      return
    }

    setSearchLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`nome.ilike.%${term}%,telefone.ilike.%${term}%`)
        .order('nome')
        .limit(10)

      if (error) throw error
      if (data) setClientes(data)
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error)
      toast.error('Erro ao buscar clientes')
    } finally {
      setSearchLoading(false)
    }
  }

  const loadVeiculos = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('modelo')

      if (error) throw error
      if (data) setVeiculos(data)
    } catch (error: any) {
      console.error('Erro ao carregar veículos:', error)
      toast.error('Erro ao carregar veículos')
    }
  }

  const handleClienteSelect = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setFormData({ 
      ...formData, 
      cliente_id: cliente.id,
      veiculo_id: '' // Reset veículo ao trocar cliente
    })
    setClientes([])
    setSearchTerm('')
  }

  const handleVeiculoSelect = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId)
    setVeiculoSelecionado(veiculo || null)
    setFormData({ ...formData, veiculo_id: veiculoId })
  }

  const handleServicoToggle = (servico: string) => {
    setSelectedServicos(prev => {
      const newServicos = prev.includes(servico)
        ? prev.filter(s => s !== servico)
        : [...prev, servico]
      
      // Atualizar campo servico_solicitado
      setFormData({ 
        ...formData, 
        servico_solicitado: newServicos.join(', ') 
      })
      
      return newServicos
    })
  }

  const handleCadastrarCliente = async () => {
    // Validações - apenas nome e telefone são obrigatórios
    if (!novoCliente.nome || !novoCliente.telefone) {
      toast.error('Nome e telefone são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: novoCliente.nome,
          telefone: novoCliente.telefone,
          email: novoCliente.email || null,
          cpf: novoCliente.cpf || null,
          endereco: novoCliente.endereco || null
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Cliente cadastrado com sucesso!')
      
      // Selecionar o cliente recém-criado
      setClienteSelecionado(data)
      setFormData({ ...formData, cliente_id: data.id })
      
      // Ir para aba de cadastro de veículo
      setActiveTab('cadastrar-veiculo')
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error)
      toast.error(error.message || 'Erro ao cadastrar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleCadastrarVeiculo = async () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente primeiro')
      return
    }

    // Validações
    if (!novoVeiculo.placa || !novoVeiculo.marca || !novoVeiculo.modelo) {
      toast.error('Placa, marca e modelo são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .insert({
          cliente_id: clienteSelecionado.id,
          placa: novoVeiculo.placa.toUpperCase(),
          marca: novoVeiculo.marca,
          modelo: novoVeiculo.modelo,
          ano: novoVeiculo.ano || null,
          cor: novoVeiculo.cor || null,
          km: novoVeiculo.km ? parseInt(novoVeiculo.km) : null
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Veículo cadastrado com sucesso!')
      
      // Selecionar o veículo recém-criado
      setVeiculoSelecionado(data)
      setFormData({ ...formData, veiculo_id: data.id })
      
      // Recarregar lista de veículos
      loadVeiculos(clienteSelecionado.id)
      
      // Voltar para aba principal
      setActiveTab('buscar-cliente')
    } catch (error: any) {
      console.error('Erro ao cadastrar veículo:', error)
      toast.error(error.message || 'Erro ao cadastrar veículo')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.cliente_id) {
      toast.error('Selecione um cliente')
      return
    }

    if (!formData.veiculo_id) {
      toast.error('Selecione um veículo')
      return
    }

    if (!formData.servico_solicitado) {
      toast.error('Selecione pelo menos um serviço')
      return
    }

    setLoading(true)

    try {
      const osData = {
        cliente_id: formData.cliente_id,
        veiculo_id: formData.veiculo_id,
        mecanico_responsavel: formData.mecanico_responsavel || null,
        servico_solicitado: formData.servico_solicitado,
        descricao: formData.descricao || null,
        data_prevista: formData.data_prevista || null,
        orcamento_estimado: formData.orcamento_estimado ? parseFloat(formData.orcamento_estimado) : null,
        pecas_gastas: formData.pecas_gastas || null,
        status: formData.status,
        data_entrada: osId ? undefined : new Date().toISOString() // Apenas para nova OS
      }

      if (osId) {
        // Atualizar OS existente
        const { data, error } = await supabase
          .from('ordem_servico')
          .update(osData)
          .eq('id', osId)
          .select()
          .single()

        if (error) throw error
        toast.success('Ordem de serviço atualizada com sucesso!')
      } else {
        // Criar nova OS
        const { data, error } = await supabase
          .from('ordem_servico')
          .insert(osData)
          .select()
          .single()

        if (error) throw error
        toast.success(`OS #${data.numero_os || data.id} criada com sucesso!`)
      }

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Erro ao salvar OS:', error)
      toast.error(error.message || 'Erro ao salvar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {osId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buscar-cliente">
              <Search className="w-4 h-4 mr-2" />
              Buscar Cliente
            </TabsTrigger>
            <TabsTrigger value="cadastrar-cliente">
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Cliente
            </TabsTrigger>
            <TabsTrigger value="cadastrar-veiculo" disabled={!clienteSelecionado}>
              <Car className="w-4 h-4 mr-2" />
              Cadastrar Veículo
            </TabsTrigger>
          </TabsList>

          {/* ABA: BUSCAR CLIENTE */}
          <TabsContent value="buscar-cliente" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SEÇÃO: DADOS DO CLIENTE */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900">Dados do Cliente</h3>
                
                {/* Busca de Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="search_cliente">Buscar Cliente (Nome ou Telefone) *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="search_cliente"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        searchClientes(e.target.value)
                      }}
                      placeholder="Digite o nome ou telefone do cliente..."
                      className="pl-10"
                      disabled={!!clienteSelecionado}
                    />
                    {clienteSelecionado && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2"
                        onClick={() => {
                          setClienteSelecionado(null)
                          setFormData({ ...formData, cliente_id: '', veiculo_id: '' })
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Resultados da busca */}
                  {searchLoading && (
                    <div className="text-sm text-gray-500">Buscando...</div>
                  )}
                  {clientes.length > 0 && !clienteSelecionado && (
                    <div className="border rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                      {clientes.map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => handleClienteSelect(cliente)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-sm text-gray-600">{cliente.telefone}</div>
                          {cliente.email && (
                            <div className="text-sm text-gray-500">{cliente.email}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cliente Selecionado */}
                {clienteSelecionado && (
                  <div className="p-4 bg-white rounded-lg border border-blue-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Nome</Label>
                        <div className="font-medium">{clienteSelecionado.nome}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Telefone</Label>
                        <div className="font-medium">{clienteSelecionado.telefone}</div>
                      </div>
                      {clienteSelecionado.email && (
                        <div className="md:col-span-2">
                          <Label className="text-xs text-gray-500">Email</Label>
                          <div className="font-medium">{clienteSelecionado.email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO: DADOS DO VEÍCULO */}
              {formData.cliente_id && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900">Dados do Veículo</h3>
                  
                  {veiculos.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="veiculo">Selecionar Veículo *</Label>
                        <Select
                          value={formData.veiculo_id}
                          onValueChange={handleVeiculoSelect}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                          <SelectContent>
                            {veiculos.map((veiculo) => (
                              <SelectItem key={veiculo.id} value={veiculo.id}>
                                {veiculo.marca} {veiculo.modelo} - {veiculo.placa} ({veiculo.ano})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Veículo Selecionado */}
                      {veiculoSelecionado && (
                        <div className="p-4 bg-white rounded-lg border border-green-300">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500">Placa</Label>
                              <div className="font-medium">{veiculoSelecionado.placa}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Marca</Label>
                              <div className="font-medium">{veiculoSelecionado.marca}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Modelo</Label>
                              <div className="font-medium">{veiculoSelecionado.modelo}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Ano</Label>
                              <div className="font-medium">{veiculoSelecionado.ano}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Nenhum veículo cadastrado para este cliente</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab('cadastrar-veiculo')}
                      >
                        <Car className="w-4 h-4 mr-2" />
                        Cadastrar Veículo
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* SEÇÃO: SERVIÇO SOLICITADO */}
              <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900">Serviço Solicitado</h3>
                
                <div className="space-y-2">
                  <Label>Selecione os Serviços *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-3 bg-white rounded-lg border">
                    {SERVICOS_OFICINA.map((servico) => (
                      <div key={servico} className="flex items-center space-x-2">
                        <Checkbox
                          id={servico}
                          checked={selectedServicos.includes(servico)}
                          onCheckedChange={() => handleServicoToggle(servico)}
                        />
                        <label
                          htmlFor={servico}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {servico}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição Detalhada</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva detalhes adicionais do serviço..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orcamento_estimado">Orçamento Estimado (R$)</Label>
                    <Input
                      id="orcamento_estimado"
                      type="number"
                      step="0.01"
                      value={formData.orcamento_estimado}
                      onChange={(e) => setFormData({ ...formData, orcamento_estimado: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pecas_gastas">Peças Gastas</Label>
                    <Input
                      id="pecas_gastas"
                      value={formData.pecas_gastas}
                      onChange={(e) => setFormData({ ...formData, pecas_gastas: e.target.value })}
                      placeholder="Ex: Filtro de óleo, Pastilhas de freio..."
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: MECÂNICO RESPONSÁVEL */}
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900">Mecânico Responsável</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="mecanico">Mecânico</Label>
                  <Select
                    value={formData.mecanico_responsavel}
                    onValueChange={(value) => setFormData({ ...formData, mecanico_responsavel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mecânico" />
                    </SelectTrigger>
                    <SelectContent>
                      {MECANICOS_FIXOS.map((mecanico) => (
                        <SelectItem key={mecanico} value={mecanico}>
                          {mecanico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SEÇÃO: DATAS */}
              <div className="space-y-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <h3 className="text-lg font-semibold text-cyan-900">Datas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_prevista">Data Prevista de Entrega</Label>
                    <Input
                      id="data_prevista"
                      type="date"
                      value={formData.data_prevista}
                      onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {osId && (
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A Receber">A Receber</SelectItem>
                          <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
                          <SelectItem value="Aguardando Peça">Aguardando Peça</SelectItem>
                          <SelectItem value="Em Execução">Em Execução</SelectItem>
                          <SelectItem value="Finalizado">Finalizado</SelectItem>
                          <SelectItem value="Pronto para Retirada">Pronto para Retirada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {osId ? 'Atualizar OS' : 'Criar OS'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* ABA: CADASTRAR CLIENTE */}
          <TabsContent value="cadastrar-cliente" className="space-y-4">
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900">Cadastrar Novo Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novo_nome">Nome Completo *</Label>
                  <Input
                    id="novo_nome"
                    value={novoCliente.nome}
                    onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_telefone">Telefone *</Label>
                  <Input
                    id="novo_telefone"
                    value={novoCliente.telefone}
                    onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_email">Email (opcional)</Label>
                  <Input
                    id="novo_email"
                    type="email"
                    value={novoCliente.email}
                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_cpf">CPF (opcional)</Label>
                  <Input
                    id="novo_cpf"
                    value={novoCliente.cpf}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="novo_endereco">Endereço (opcional)</Label>
                  <Input
                    id="novo_endereco"
                    value={novoCliente.endereco}
                    onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('buscar-cliente')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCadastrarCliente}
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cadastrar Cliente
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ABA: CADASTRAR VEÍCULO */}
          <TabsContent value="cadastrar-veiculo" className="space-y-4">
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900">Cadastrar Novo Veículo</h3>
              
              {clienteSelecionado && (
                <div className="p-3 bg-white rounded-lg border border-green-300 mb-4">
                  <Label className="text-xs text-gray-500">Cliente</Label>
                  <div className="font-medium">{clienteSelecionado.nome}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novo_placa">Placa *</Label>
                  <Input
                    id="novo_placa"
                    value={novoVeiculo.placa}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value.toUpperCase() })}
                    placeholder="ABC-1234"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_marca">Marca *</Label>
                  <Input
                    id="novo_marca"
                    value={novoVeiculo.marca}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, marca: e.target.value })}
                    placeholder="Ex: Volkswagen, Fiat, Chevrolet"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_modelo">Modelo *</Label>
                  <Input
                    id="novo_modelo"
                    value={novoVeiculo.modelo}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })}
                    placeholder="Ex: Gol, Uno, Onix"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_ano">Ano</Label>
                  <Input
                    id="novo_ano"
                    value={novoVeiculo.ano}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, ano: e.target.value })}
                    placeholder="2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_cor">Cor</Label>
                  <Input
                    id="novo_cor"
                    value={novoVeiculo.cor}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, cor: e.target.value })}
                    placeholder="Ex: Preto, Branco, Prata"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo_km">Quilometragem</Label>
                  <Input
                    id="novo_km"
                    type="number"
                    value={novoVeiculo.km}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, km: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('buscar-cliente')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCadastrarVeiculo}
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cadastrar Veículo
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
