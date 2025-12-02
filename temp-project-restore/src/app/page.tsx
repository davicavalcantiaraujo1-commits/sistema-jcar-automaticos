'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, Plus, Users, FileText, Car, Package, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import NovaOSDialog from './components/nova-os-dialog'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [novaOSOpen, setNovaOSOpen] = useState(false)
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalVeiculos: 0,
    osAbertas: 0,
    osConcluidas: 0,
    totalPecas: 0,
    faturamentoMes: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Total de clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // Total de veículos
      const { count: veiculosCount } = await supabase
        .from('veiculos')
        .select('*', { count: 'exact', head: true })

      // OS abertas (não finalizadas)
      const { count: osAbertasCount } = await supabase
        .from('ordem_servico')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Finalizado')

      // OS concluídas
      const { count: osConcluidasCount } = await supabase
        .from('ordem_servico')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Finalizado')

      // Total de peças
      const { count: pecasCount } = await supabase
        .from('pecas')
        .select('*', { count: 'exact', head: true })

      // Faturamento do mês atual
      const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data: faturamentoData } = await supabase
        .from('ordem_servico')
        .select('valor_total')
        .eq('status', 'Finalizado')
        .gte('data_conclusao', primeiroDiaMes)

      const faturamentoTotal = faturamentoData?.reduce((sum, os) => sum + (os.valor_total || 0), 0) || 0

      setStats({
        totalClientes: clientesCount || 0,
        totalVeiculos: veiculosCount || 0,
        osAbertas: osAbertasCount || 0,
        osConcluidas: osConcluidasCount || 0,
        totalPecas: pecasCount || 0,
        faturamentoMes: faturamentoTotal
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">JCAR AUTOMÁTICOS</h1>
                <p className="text-blue-100 text-sm">Sistema de Gestão de Oficina</p>
              </div>
            </div>
            <Button 
              onClick={() => setNovaOSOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
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
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalClientes}</div>
              <p className="text-xs opacity-80 mt-1">Clientes cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Veículos</CardTitle>
              <Car className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalVeiculos}</div>
              <p className="text-xs opacity-80 mt-1">Veículos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
              <Clock className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.osAbertas}</div>
              <p className="text-xs opacity-80 mt-1">Em andamento</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">OS Concluídas</CardTitle>
              <CheckCircle className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.osConcluidas}</div>
              <p className="text-xs opacity-80 mt-1">Finalizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Peças em Estoque</CardTitle>
              <Package className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPecas}</div>
              <p className="text-xs opacity-80 mt-1">Itens cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs opacity-80 mt-1">Mês atual</p>
            </CardContent>
          </Card>
        </div>

        {/* Menu de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/clientes">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Clientes</CardTitle>
                    <p className="text-sm text-gray-500">Gerenciar clientes</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/ordens-servico">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-orange-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Ordens de Serviço</CardTitle>
                    <p className="text-sm text-gray-500">Gerenciar OS</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/veiculos">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-green-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Car className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Veículos</CardTitle>
                    <p className="text-sm text-gray-500">Gerenciar veículos</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/pecas">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-cyan-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <Package className="w-8 h-8 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Estoque de Peças</CardTitle>
                    <p className="text-sm text-gray-500">Controle de estoque</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/faturamento">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-emerald-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Faturamento</CardTitle>
                    <p className="text-sm text-gray-500">Relatórios financeiros</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Card 
            className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-500"
            onClick={() => setNovaOSOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Plus className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Nova OS</CardTitle>
                  <p className="text-sm text-gray-500">Criar ordem de serviço</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Dialog Nova OS */}
      <NovaOSDialog 
        open={novaOSOpen} 
        onOpenChange={setNovaOSOpen}
        onSuccess={() => {
          loadStats()
        }}
      />
    </div>
  )
}
