'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Mail, MessageSquare, LogOut } from 'lucide-react'

// Mock data for UI dev
const mockStickers = [
  { id: '1', content: 'Eres genial! 🎉', style: 'bg-yellow-200 rotate-2', x: 10, y: 20 },
  { id: '2', content: 'Gracias por el café ☕', style: 'bg-pink-200 -rotate-1', x: 50, y: 10 },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'wall' | 'inbox'>('wall')

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* App Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💘</span>
          <h1 className="font-bold text-gray-800 hidden sm:block">Buzón del Amor</h1>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-full">
          <button 
            onClick={() => setActiveTab('wall')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'wall' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}
          >
            Muro Público
          </button>
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'inbox' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}
          >
            Mi Buzón
          </button>
        </div>

        <button className="p-2 text-gray-500 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'wall' ? (
            <motion.div 
              key="wall"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full relative"
            >
              {/* Wall Area */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mockStickers.map((sticker) => (
                  <div 
                    key={sticker.id}
                    className={`aspect-square p-4 shadow-md rounded-sm flex items-center justify-center text-center font-handwriting text-lg ${sticker.style}`}
                  >
                    {sticker.content}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
             <motion.div 
              key="inbox"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Tus Mensajes Privados</h2>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                <p className="text-gray-600">No tienes mensajes nuevos todavía... ¡Envía uno para romper el hielo!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-700 transition-transform hover:scale-110 active:scale-95">
        <Plus size={24} />
      </button>
    </div>
  )
}
