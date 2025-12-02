'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Plus, Search, Edit, Eye, ArrowLeft, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import { supabase, type OrdemServico, type Cliente, type Veiculo, type Peca } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import NovaOSDialog from '../components/nova-os-dialog'

interface OSComRelacoes extends OrdemServico {
  clientes?: Cliente
  veiculos?: Veiculo
}

export default function OrdensServicoPage() {
  const [ordens, setOrdens] = useState<OSComRelacoes[]>([])
  const [pecas, setPecas] = useState<Peca[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false)
  const [selectedOS, setSelectedOS] = useState<OSComRelacoes | null>(null)
  const [novaOSOpen, setNovaOSOpen] = useState(false)
  
  const [finalizarData, setFinalizarData] = useState({
    valor_total: '',
    pecas_utilizadas: [] as { peca_id: string; quantidade: number }[],
    observacoes: ''
  })

  useEffect(() => {
    loadOrdens()
    loadPecas()
  }, [])

  const loadOrdens = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ordem_servico')
        .select('*, clientes(*), veiculos(*)')
        .order('data_entrada', { ascending: false })

      if (error) throw error
      setOrdens(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar ordens:', error)
      toast.error('Erro ao carregar ordens de serviço')
    } finally {
      setLoading(false)
    }
  }

  const loadPecas = async () => {
    try {
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .order('nome')

      if (error) throw error
      setPecas(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar peças:', error)
    }
  }

  const handleOpenFinalizarDialog = (os: OSComRelacoes) => {
    setSelectedOS(os)
    setFinalizarData({
      valor_total: os.valor_total?.toString() || '',
      pecas_utilizadas: [],
      observacoes: os.observacoes || ''
    })
    setFinalizarDialogOpen(true)
  }

  const handleAdicionarPeca = () => {
    setFinalizarData({
      ...finalizarData,
      pecas_utilizadas: [
        ...finalizarData.pecas_utilizadas,
        { peca_id: '', quantidade: 1 }
      ]
    })
  }

  const handleRemoverPeca = (index: number) => {
    setFinalizarData({
      ...finalizarData,
      pecas_utilizadas: finalizarData.pecas_utilizadas.filter((_, i) => i !== index)
    })
  }

  const handleUpdatePeca = (index: number, field: 'peca_id' | 'quantidade', value: string | number) => {
    const newPecas = [...finalizarData.pecas_utilizadas]
    newPecas[index] = { ...newPecas[index], [field]: value }
    setFinalizarData({ ...finalizarData, pecas_utilizadas: newPecas })
  }

  const handleFinalizar = async () => {
    if (!selectedOS) return

    if (!finalizarData.valor_total) {
      toast.error('Informe o valor total do serviço')
      return
    }

    try {
      // Atualizar ordem de serviço
      const { error: osError } = await supabase
        .from('ordem_servico')
        .update({
          status: 'Finalizado',
          valor_total: parseFloat(finalizarData.valor_total),
          observacoes: finalizarData.observacoes || null,
          data_conclusao: new Date().toISOString()
        })
        .eq('id', selectedOS.id)

      if (osError) throw osError

      // Registrar peças utilizadas
      if (finalizarData.pecas_utilizadas.length > 0) {
        const pecasParaInserir = finalizarData.pecas_utilizadas
          .filter(p => p.peca_id && p.quantidade > 0)
          .map(p => ({
            ordem_servico_id: selectedOS.id,
            peca_id: p.peca_id,
            quantidade: p.quantidade
          }))

        if (pecasParaInserir.length > 0) {
          const { error: pecasError } = await supabase
            .from('ordem_servico_pecas')
            .insert(pecasParaInserir)

          if (pecasError) throw pecasError

          // Atualizar estoque das peças
          for (const peca of finalizarData.pecas_utilizadas) {
            if (peca.peca_id && peca.quantidade > 0) {
              const pecaAtual = pecas.find(p => p.id === peca.peca_id)
              if (pecaAtual) {
                await supabase
                  .from('pecas')
                  .update({ quantidade: (pecaAtual.quantidade || 0) - peca.quantidade })
                  .eq('id', peca.peca_id)
              }
            }
          }
        }
      }

      toast.success('Ordem de serviço finalizada com sucesso!')
      setFinalizarDialogOpen(false)
      loadOrdens()
      loadPecas()
    } catch (error: any) {
      console.error('Erro ao finalizar OS:', error)
      toast.error(error.message || 'Erro ao finalizar ordem de serviço')
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ordem_servico')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      toast.success('Status atualizado com sucesso!')
      loadOrdens()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      'A Receber': { variant: 'secondary', icon: Clock },
      'Aguardando Aprovação': { variant: 'outline', icon: AlertCircle },
      'Aguardando Peça': { variant: 'outline', icon: AlertCircle },
      'Em Execução': { variant: 'default', icon: Clock },
      'Finalizado': { variant: 'default', icon: CheckCircle },
      'Pronto para Retirada': { variant: 'default', icon: CheckCircle }
    }

    const config = statusConfig[status] || { variant: 'secondary', icon: Clock }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const filteredOrdens = ordens.filter(os => {
    const matchesSearch = 
      os.numero_os?.toString().includes(searchTerm) ||
      os.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.veiculos?.placa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-orange-700">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <FileText className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
                <p className="text-orange-100 text-sm">Gerenciamento de OS</p>
              </div>
            </div>
            <Button 
              onClick={() => setNovaOSOpen(true)}
              className="bg-white text-orange-600 hover:bg-orange-50"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova OS
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-2xl">Lista de Ordens de Serviço</CardTitle>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar OS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="A Receber">A Receber</SelectItem>
                    <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
                    <SelectItem value="Aguardando Peça">Aguardando Peça</SelectItem>
                    <SelectItem value="Em Execução">Em Execução</SelectItem>
                    <SelectItem value="Pronto para Retirada">Pronto para Retirada</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredOrdens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || statusFilter !== 'todos' ? 'Nenhuma OS encontrada' : 'Nenhuma OS cadastrada'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS #</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Data Entrada</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdens.map((os) => (
                      <TableRow key={os.id}>
                        <TableCell className="font-medium">#{os.numero_os || os.id.slice(0, 8)}</TableCell>
                        <TableCell>{os.clientes?.nome || '-'}</TableCell>
                        <TableCell>
                          {os.veiculos ? `${os.veiculos.marca} ${os.veiculos.modelo} - ${os.veiculos.placa}` : '-'}
                        </TableCell>
                        <TableCell>
                          {os.data_entrada ? new Date(os.data_entrada).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(os.status)}</TableCell>
                        <TableCell>
                          {os.valor_total ? `R$ ${os.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(os.status === 'Pronto para Retirada' || os.status === 'Em Execução') && !os.valor_total && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenFinalizarDialog(os)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Finalizar
                              </Button>
                            )}
                            {os.status !== 'Finalizado' && (
                              <Select
                                value={os.status}
                                onValueChange={(value) => handleUpdateStatus(os.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A Receber">A Receber</SelectItem>
                                  <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
                                  <SelectItem value="Aguardando Peça">Aguardando Peça</SelectItem>
                                  <SelectItem value="Em Execução">Em Execução</SelectItem>
                                  <SelectItem value="Pronto para Retirada">Pronto para Retirada</SelectItem>
                                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog Finalizar OS */}
      <Dialog open={finalizarDialogOpen} onOpenChange={setFinalizarDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          
          {selectedOS && (
            <div className="space-y-6">
              {/* Informações da OS */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Informações da OS</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Cliente:</span>
                    <div className="font-medium">{selectedOS.clientes?.nome}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Veículo:</span>
                    <div className="font-medium">
                      {selectedOS.veiculos ? `${selectedOS.veiculos.marca} ${selectedOS.veiculos.modelo}` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total do Serviço *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  value={finalizarData.valor_total}
                  onChange={(e) => setFinalizarData({ ...finalizarData, valor_total: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Peças Utilizadas */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Peças Utilizadas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAdicionarPeca}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Peça
                  </Button>
                </div>

                {finalizarData.pecas_utilizadas.map((peca, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={peca.peca_id}
                        onValueChange={(value) => handleUpdatePeca(index, 'peca_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a peça" />
                        </SelectTrigger>
                        <SelectContent>
                          {pecas.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome} - R$ {p.preco_venda.toFixed(2)} (Estoque: {p.quantidade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={peca.quantidade}
                        onChange={(e) => handleUpdatePeca(index, 'quantidade', parseInt(e.target.value) || 1)}
                        placeholder="Qtd"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoverPeca(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={finalizarData.observacoes}
                  onChange={(e) => setFinalizarData({ ...finalizarData, observacoes: e.target.value })}
                  placeholder="Observações sobre o serviço realizado..."
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFinalizarDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleFinalizar} className="bg-green-600 hover:bg-green-700">
                  Finalizar OS
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Nova OS */}
      <NovaOSDialog 
        open={novaOSOpen} 
        onOpenChange={setNovaOSOpen}
        onSuccess={() => {
          loadOrdens()
        }}
      />
    </div>
  )
}
