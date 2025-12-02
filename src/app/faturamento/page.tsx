'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, ArrowLeft, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react'
import { supabase, type OrdemServico, type Cliente, type Veiculo } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'

interface OSComRelacoes extends OrdemServico {
  clientes?: Cliente
  veiculos?: Veiculo
}

export default function FaturamentoPage() {
  const [ordens, setOrdens] = useState<OSComRelacoes[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes-atual')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  
  const [stats, setStats] = useState({
    totalFaturado: 0,
    totalOS: 0,
    ticketMedio: 0,
    comparacaoMesAnterior: 0
  })

  useEffect(() => {
    loadFaturamento()
  }, [periodo, dataInicio, dataFim])

  const loadFaturamento = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('ordem_servico')
        .select('*, clientes(*), veiculos(*)')
        .eq('status', 'Finalizado')
        .not('valor_total', 'is', null)
        .order('data_conclusao', { ascending: false })

      // Filtrar por período
      const hoje = new Date()
      let dataInicial: Date
      let dataFinal: Date = hoje

      switch (periodo) {
        case 'mes-atual':
          dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          break
        case 'mes-anterior':
          dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
          dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
          break
        case 'ultimos-30-dias':
          dataInicial = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'ultimos-90-dias':
          dataInicial = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'ano-atual':
          dataInicial = new Date(hoje.getFullYear(), 0, 1)
          break
        case 'personalizado':
          if (dataInicio && dataFim) {
            dataInicial = new Date(dataInicio)
            dataFinal = new Date(dataFim)
          } else {
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          }
          break
        default:
          dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      }

      query = query
        .gte('data_conclusao', dataInicial.toISOString())
        .lte('data_conclusao', dataFinal.toISOString())

      const { data, error } = await query

      if (error) throw error

      setOrdens(data || [])

      // Calcular estatísticas
      const totalFaturado = data?.reduce((sum, os) => sum + (os.valor_total || 0), 0) || 0
      const totalOS = data?.length || 0
      const ticketMedio = totalOS > 0 ? totalFaturado / totalOS : 0

      // Calcular comparação com mês anterior
      const mesAnteriorInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesAnteriorFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      
      const { data: dataMesAnterior } = await supabase
        .from('ordem_servico')
        .select('valor_total')
        .eq('status', 'Finalizado')
        .not('valor_total', 'is', null)
        .gte('data_conclusao', mesAnteriorInicio.toISOString())
        .lte('data_conclusao', mesAnteriorFim.toISOString())

      const totalMesAnterior = dataMesAnterior?.reduce((sum, os) => sum + (os.valor_total || 0), 0) || 0
      const comparacao = totalMesAnterior > 0 ? ((totalFaturado - totalMesAnterior) / totalMesAnterior) * 100 : 0

      setStats({
        totalFaturado,
        totalOS,
        ticketMedio,
        comparacaoMesAnterior: comparacao
      })
    } catch (error: any) {
      console.error('Erro ao carregar faturamento:', error)
      toast.error('Erro ao carregar faturamento')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-700">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <DollarSign className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Faturamento</h1>
                <p className="text-emerald-100 text-sm">Relatórios financeiros</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Período de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="periodo">Período</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger id="periodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes-atual">Mês Atual</SelectItem>
                    <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                    <SelectItem value="ultimos-30-dias">Últimos 30 Dias</SelectItem>
                    <SelectItem value="ultimos-90-dias">Últimos 90 Dias</SelectItem>
                    <SelectItem value="ano-atual">Ano Atual</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodo === 'personalizado' && (
                <>
                  <div className="flex-1">
                    <Label htmlFor="data-inicio">Data Início</Label>
                    <Input
                      id="data-inicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="data-fim">Data Fim</Label>
                    <Input
                      id="data-fim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
              <DollarSign className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(stats.totalFaturado)}</div>
              <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                {stats.comparacaoMesAnterior >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>+{stats.comparacaoMesAnterior.toFixed(1)}% vs mês anterior</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>{stats.comparacaoMesAnterior.toFixed(1)}% vs mês anterior</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">OS Finalizadas</CardTitle>
              <FileText className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOS}</div>
              <p className="text-xs opacity-80 mt-1">Ordens de serviço</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(stats.ticketMedio)}</div>
              <p className="text-xs opacity-80 mt-1">Por ordem de serviço</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Período</CardTitle>
              <Calendar className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {periodo === 'mes-atual' && 'Mês Atual'}
                {periodo === 'mes-anterior' && 'Mês Anterior'}
                {periodo === 'ultimos-30-dias' && 'Últimos 30 Dias'}
                {periodo === 'ultimos-90-dias' && 'Últimos 90 Dias'}
                {periodo === 'ano-atual' && 'Ano Atual'}
                {periodo === 'personalizado' && 'Personalizado'}
              </div>
              <p className="text-xs opacity-80 mt-1">Período selecionado</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ordens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Detalhamento de Ordens de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : ordens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma ordem de serviço finalizada neste período
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS #</TableHead>
                      <TableHead>Data Conclusão</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordens.map((os) => (
                      <TableRow key={os.id}>
                        <TableCell className="font-medium">
                          #{os.numero_os || os.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {os.data_conclusao ? formatDate(os.data_conclusao) : '-'}
                        </TableCell>
                        <TableCell>{os.clientes?.nome || '-'}</TableCell>
                        <TableCell>
                          {os.veiculos ? `${os.veiculos.marca} ${os.veiculos.modelo}` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {os.servico_solicitado || '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(os.valor_total || 0)}
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
    </div>
  )
}
