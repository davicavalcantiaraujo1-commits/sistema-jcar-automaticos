'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wrench, Plus } from 'lucide-react'
import NovaOSDialog from './components/nova-os-dialog'

export default function Home() {
  const [novaOSOpen, setNovaOSOpen] = useState(false)

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
        <div className="text-center py-20">
          <Wrench className="w-24 h-24 mx-auto text-blue-600 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Bem-vindo ao Sistema JCAR
          </h2>
          <p className="text-gray-600 mb-8">
            Clique no botão "Nova OS" para criar uma ordem de serviço
          </p>
          <Button 
            onClick={() => setNovaOSOpen(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Nova Ordem de Serviço
          </Button>
        </div>
      </main>

      {/* Dialog Nova OS */}
      <NovaOSDialog 
        open={novaOSOpen} 
        onOpenChange={setNovaOSOpen}
        onSuccess={() => {
          console.log('OS criada com sucesso!')
        }}
      />
    </div>
  )
}
