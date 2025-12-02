'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Search, Edit, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { supabase, type Peca } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PecasPage() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    quantidade: '',
    quantidade_minima: '',
    preco_custo: '',
    preco_venda: '',
    fornecedor: '',
    localizacao: ''
  })

  useEffect(() => {
    loadPecas()
  }, [])

  const loadPecas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .order('nome')

      if (error) throw error
      setPecas(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar peças:', error)
      toast.error('Erro ao carregar peças')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (peca?: Peca) => {
    if (peca) {
      setEditingPeca(peca)
      setFormData({
        nome: peca.nome,
        codigo: peca.codigo || '',
        quantidade: peca.quantidade?.toString() || '0',
        quantidade_minima: peca.quantidade_minima?.toString() || '0',
        preco_custo: peca.preco_custo?.toString() || '0',
        preco_venda: peca.preco_venda?.toString() || '0',
        fornecedor: peca.fornecedor || '',
        localizacao: peca.localizacao || ''
      })
    } else {
      setEditingPeca(null)
      setFormData({
        nome: '',
        codigo: '',
        quantidade: '0',
        quantidade_minima: '0',
        preco_custo: '0',
        preco_venda: '0',
        fornecedor: '',
        localizacao: ''
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome da peça é obrigatório')
      return
    }

    try {
      const pecaData = {
        nome: formData.nome,
        codigo: formData.codigo || null,
        quantidade: parseInt(formData.quantidade) || 0,
        quantidade_minima: parseInt(formData.quantidade_minima) || 0,
        preco_custo: parseFloat(formData.preco_custo) || 0,
        preco_venda: parseFloat(formData.preco_venda) || 0,
        fornecedor: formData.fornecedor || null,
        localizacao: formData.localizacao || null
      }

      if (editingPeca) {
        const { error } = await supabase
          .from('pecas')
          .update(pecaData)
          .eq('id', editingPeca.id)

        if (error) throw error
        toast.success('Peça atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('pecas')
          .insert(pecaData)

        if (error) throw error
        toast.success('Peça cadastrada com sucesso!')
      }

      setDialogOpen(false)
      loadPecas()
    } catch (error: any) {
      console.error('Erro ao salvar peça:', error)
      toast.error(error.message || 'Erro ao salvar peça')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta peça?')) return

    try {
      const { error } = await supabase
        .from('pecas')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Peça excluída com sucesso!')
      loadPecas()
    } catch (error: any) {
      console.error('Erro ao excluir peça:', error)
      toast.error('Erro ao excluir peça. Verifique se não há ordens de serviço vinculadas.')
    }
  }

  const filteredPecas = pecas.filter(peca =>
    peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (peca.codigo && peca.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (peca.fornecedor && peca.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const pecasEstoqueBaixo = pecas.filter(p => p.quantidade <= p.quantidade_minima)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-cyan-700">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <Package className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Estoque de Peças</h1>
                <p className="text-cyan-100 text-sm">Controle de estoque</p>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-white text-cyan-600 hover:bg-cyan-50"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Peça
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Alerta de Estoque Baixo */}
        {pecasEstoqueBaixo.length > 0 && (
          <Card className="mb-6 border-orange-500 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="w-5 h-5" />
                Atenção: {pecasEstoqueBaixo.length} peça(s) com estoque baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pecasEstoqueBaixo.map((peca) => (
                  <div key={peca.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{peca.nome}</span>
                    <Badge variant="destructive">
                      Estoque: {peca.quantidade} (Mín: {peca.quantidade_minima})
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-2xl">Lista de Peças</CardTitle>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, código ou fornecedor..."
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
            ) : filteredPecas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhuma peça encontrada' : 'Nenhuma peça cadastrada'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço Custo</TableHead>
                      <TableHead>Preço Venda</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPecas.map((peca) => (
                      <TableRow key={peca.id}>
                        <TableCell className="font-medium">{peca.nome}</TableCell>
                        <TableCell>{peca.codigo || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{peca.quantidade}</span>
                            {peca.quantidade <= peca.quantidade_minima && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>R$ {peca.preco_custo.toFixed(2)}</TableCell>
                        <TableCell>R$ {peca.preco_venda.toFixed(2)}</TableCell>
                        <TableCell>{peca.fornecedor || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(peca)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(peca.id)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPeca ? 'Editar Peça' : 'Nova Peça'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Peça *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade em Estoque</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="0"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade_minima">Quantidade Mínima</Label>
                <Input
                  id="quantidade_minima"
                  type="number"
                  min="0"
                  value={formData.quantidade_minima}
                  onChange={(e) => setFormData({ ...formData, quantidade_minima: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_custo">Preço de Custo</Label>
                <Input
                  id="preco_custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_venda">Preço de Venda</Label>
                <Input
                  id="preco_venda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização no Estoque</Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Prateleira A3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPeca ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
