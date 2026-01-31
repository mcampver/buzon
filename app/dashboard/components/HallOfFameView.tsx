import { Message } from '../types'

export default function HallOfFameView({ messages }: { messages: Message[] }) {
  // Messages are already sorted by popularity from API call
  const topMessages = messages
    .filter(m => m.totalReactions && m.totalReactions > 0)
    .slice(0, 10)

  if (topMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in zoom-in duration-500">
        <div className="text-6xl animate-bounce">🏆</div>
        <h3 className="text-xl font-bold text-gray-800">El Salón de la Fama está vacío</h3>
        <p className="text-gray-500 max-w-md">
          Sé el primero en obtener reacciones y aparecer aquí. ¡Envía mensajes creativos y divertidos!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl font-bold text-gray-800 font-handwriting transform -rotate-1">🌟 Salón de la Fama 🌟</h2>
        <p className="text-gray-600">Los mensajes más legendarios de todos los tiempos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topMessages.map((msg, index) => (
          <div key={msg.id} className="relative group">
            <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 border-4 border-white ${index === 0 ? 'bg-yellow-400 scale-110' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-pink-400'}`}>
              #{index + 1}
            </div>
            {index === 0 && <div className="absolute -top-8 left-0 right-0 text-center text-2xl animate-bounce">👑</div>}
            
            <div 
              className={`aspect-video md:aspect-square p-6 shadow-lg rounded-2xl flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] relative ${msg.style ? JSON.parse(msg.style).color : 'bg-yellow-200'}`}
              style={{ transform: msg.style ? `rotate(${JSON.parse(msg.style).rotation}deg)` : 'rotate(0deg)' }}
            >
               <div className="font-handwriting text-2xl text-gray-800 mb-4 line-clamp-6">
                "{msg.content}"
              </div>
              <div className="mt-auto flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
                <span>🔥</span>
                <span className="font-bold text-gray-800">{msg.totalReactions} reacciones</span>
              </div>
              {msg.toName && (
                <div className="absolute bottom-2 right-2 text-xs opacity-60 font-medium">
                  Para: {msg.toName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
