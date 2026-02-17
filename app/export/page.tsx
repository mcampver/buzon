'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ExportData {
  totalMessages: number
  publicMessages: number
  privateMessages: number
  totalReactions: number
  totalComments: number
  messages: any[]
}

export default function ExportPage() {
  const [data, setData] = useState<ExportData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/export')
        if (res.ok) {
          setData(await res.json())
        } else {
          alert('Error al cargar datos. ¿Eres admin?')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error(error)
        alert('Error al cargar datos')
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos para exportar...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          h1, h2, h3 { page-break-after: avoid; }
          .message-card { page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-8 bg-white">
        {/* Print Button */}
        <div className="no-print mb-8 flex gap-4 items-center sticky top-0 bg-white z-10 py-4 border-b">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-colors"
          >
            📄 Guardar como PDF
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ← Volver al Dashboard
          </button>
          <p className="text-sm text-gray-500">
            Haz clic en "Guardar como PDF" y luego usa "Imprimir &gt; Guardar como PDF" en tu navegador
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b-4 border-pink-200">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
            💘 Buzón del Amor
          </h1>
          <p className="text-2xl text-gray-600 font-handwriting">Reporte Completo</p>
          <p className="text-sm text-gray-400 mt-2">
            Generado el {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-200 pb-2">
            📊 Estadísticas Generales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
              <div className="text-3xl font-bold text-pink-600">{data.totalMessages}</div>
              <div className="text-sm text-gray-600">Total de Mensajes</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{data.publicMessages}</div>
              <div className="text-sm text-gray-600">Mensajes Públicos</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{data.privateMessages}</div>
              <div className="text-sm text-gray-600">Mensajes Privados</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600">{data.totalReactions}</div>
              <div className="text-sm text-gray-600">Total Reacciones</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{data.totalComments}</div>
              <div className="text-sm text-gray-600">Total Comentarios</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="page-break">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-200 pb-2">
            💌 Todos los Mensajes
          </h2>
          
          {data.messages.map((msg, idx) => (
            <div key={msg.id} className="message-card mb-8 p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
              {/* Header */}
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Mensaje #{idx + 1}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <div><strong>De:</strong> {msg.fromName || 'Anónimo'}</div>
                    <div><strong>Para:</strong> {msg.toName || 'Todos (Público)'}</div>
                    <div><strong>Fecha:</strong> {new Date(msg.createdAt).toLocaleString('es-ES')}</div>
                    <div><strong>Tema:</strong> {msg.theme || 'pastel'}</div>
                    <div><strong>Tipo:</strong> {msg.isPublic ? 'Público (Muro)' : 'Privado (Buzón)'}</div>
                  </div>
                </div>
                {msg.theme && (
                  <div className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                    {msg.theme}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">📝 Contenido:</h4>
                <div className="bg-white p-4 rounded border border-gray-200 text-gray-800 italic">
                  "{msg.content}"
                </div>
              </div>

              {/* Media */}
              {(msg.spotifyUrl || msg.gifUrl) && (
                <div className="mb-4 bg-white p-3 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">🎨 Multimedia:</h4>
                  <div className="space-y-1 text-sm">
                    {msg.spotifyUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">🎵</span>
                        <span className="text-gray-600">Música:</span>
                        <a href={msg.spotifyUrl} className="text-blue-600 hover:underline truncate" target="_blank">
                          {msg.spotifyUrl}
                        </a>
                      </div>
                    )}
                    {msg.gifUrl && (
                      <div className="flex items-center gap-2">
                        <span>🖼️</span>
                        <span className="text-gray-600">GIF:</span>
                        <a href={msg.gifUrl} className="text-blue-600 hover:underline truncate" target="_blank">
                          {msg.gifUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reactions */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">💕 Reacciones:</h4>
                  <div className="flex flex-wrap gap-2">
                    {msg.reactions.map((r: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-white rounded border border-gray-200 text-sm">
                        {r.emoji} ×{r.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {msg.comments && msg.comments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">💬 Comentarios ({msg.comments.length}):</h4>
                  <div className="space-y-2">
                    {msg.comments.map((c: any, i: number) => (
                      <div key={i} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-800 text-sm">{c.username}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(c.createdAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200 text-center text-gray-500 text-sm">
          <p>💘 Buzón del Amor - Un proyecto lleno de cariño</p>
          <p className="mt-2">Gracias por formar parte de esta experiencia 🌟</p>
        </div>
      </div>
    </>
  )
}
