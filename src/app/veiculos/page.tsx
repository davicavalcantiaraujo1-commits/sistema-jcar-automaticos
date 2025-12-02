'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { supabase, type Veiculo, type Cliente } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<(Veiculo & { clientes?: Cliente })[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null)
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    cor: '',
    km: ''
  })

  useEffect(() => {
    loadVeiculos()
    loadClientes()
  }, [])

  const loadVeiculos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('veiculos')
        .select('*, clientes(*)')
        .order('modelo')

      if (error) throw error
      setVeiculos(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar veículos:', error)
      toast.error('Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleOpenDialog = (veiculo?: Veiculo) => {
    if (veiculo) {
      setEditingVeiculo(veiculo)
      setFormData({
        cliente_id: veiculo.cliente_id,
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano || '',
        cor: veiculo.cor || '',
        km: veiculo.km?.toString() || ''
      })
    } else {
      setEditingVeiculo(null)
      setFormData({
        cliente_id: '',
        placa: '',
        marca: '',
        modelo: '',
        ano: '',
        cor: '',
        km: ''
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cliente_id || !formData.placa || !formData.marca || !formData.modelo) {
      toast.error('Cliente, placa, marca e modelo são obrigatórios')
      return
    }

    try {
      const veiculoData = {
        cliente_id: formData.cliente_id,
        placa: formData.placa.toUpperCase(),
        marca: formData.marca,
        modelo: formData.modelo,
        ano: formData.ano || null,
        cor: formData.cor || null,
        km: formData.km ? parseInt(formData.km) : null
      }

      if (editingVeiculo) {
        const { error } = await supabase
          .from('veiculos')
          .update(veiculoData)
          .eq('id', editingVeiculo.id)

        if (error) throw error
        toast.success('Veículo atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('veiculos')
          .insert(veiculoData)

        if (error) throw error
        toast.success('Veículo cadastrado com sucesso!')
      }

      setDialogOpen(false)
      loadVeiculos()
    } catch (error: any) {
      console.error('Erro ao salvar veículo:', error)
      toast.error(error.message || 'Erro ao salvar veículo')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return

    try {
      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Veículo excluído com sucesso!')
      loadVeiculos()
    } catch (error: any) {
      console.error('Erro ao excluir veículo:', error)
      toast.error('Erro ao excluir veículo')
    }
  }

  const filteredVeiculos = veiculos.filter(veiculo =>
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (veiculo.clientes?.nome && veiculo.clientes.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <Car className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Veículos</h1>
                <p className="text-green-100 text-sm">Gerenciamento de veículos</p>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-white text-green-600 hover:bg-green-50"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Veículo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-2xl">Lista de Veículos</CardTitle>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por placa, marca, modelo ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredVeiculos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVeiculos.map((veiculo) => (
                      <TableRow key={veiculo.id}>
                        <TableCell className="font-medium">{veiculo.placa}</TableCell>
                        <TableCell>{veiculo.marca}</TableCell>
                        <TableCell>{veiculo.modelo}</TableCell>
                        <TableCell>{veiculo.ano || '-'}</TableCell>
                        <TableCell>{veiculo.clientes?.nome || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(veiculo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(veiculo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      {/* Dialog Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa *</Label>
                <Input
                  id="placa"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  placeholder="ABC-1234"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  value={formData.ano}
                  onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                  placeholder="2020"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="km">Quilometragem</Label>
                <Input
                  id="km"
                  type="number"
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingVeiculo ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
