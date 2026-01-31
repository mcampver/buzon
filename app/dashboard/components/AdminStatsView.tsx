import { Message } from '../types'

interface AdminStatsViewProps {
  stats: any
  messages: Message[]
}

export default function AdminStatsView({ stats, messages }: AdminStatsViewProps) {
  if (!stats) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando estadísticas...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl shadow-sm border border-pink-100">
          <div className="text-3xl mb-2">📬</div>
          <div className="text-3xl font-bold text-pink-600">{stats.overview.totalMessages}</div>
          <div className="text-sm text-gray-600">Total Mensajes</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm border border-blue-100">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-blue-600">{stats.overview.totalUsers}</div>
          <div className="text-sm text-gray-600">Usuarios Activos</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="text-3xl mb-2">❤️</div>
          <div className="text-3xl font-bold text-red-600">{stats.overview.totalReactions}</div>
          <div className="text-sm text-gray-600">Total Reacciones</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-purple-600">{stats.overview.avgMessagesPerUser}</div>
          <div className="text-sm text-gray-600">Promedio/Usuario</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Romantics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🏆 Top 5 Románticos
          </h3>
          <div className="space-y-3">
            {stats.rankings.topSenders.map((user: any, i: number) => (
              <div key={user.username} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </div>
                  <span className="font-medium text-gray-700">{user.username}</span>
                </div>
                <div className="flex items-center gap-1 text-pink-500 font-bold">
                  {user.count} 💌
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fun Stats Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            😄 Curiosidades
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-xl text-center">
              <div className="text-sm text-gray-500 mb-1">Emoji Favorito</div>
              <div className="text-4xl">{stats.funStats.favoriteEmoji}</div>
            </div>
            <div className={`p-4 rounded-xl text-center shadow-sm ${stats.funStats.favoriteColor}`}>
              <div className="text-sm text-gray-800/60 mb-1">Color Favorito</div>
              <div className="text-xl font-bold text-gray-800/80">Este!</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl col-span-2">
              <div className="text-sm text-gray-500 mb-2">✍️ El Más Expresivo</div>
              <div className="font-bold text-purple-700">{stats.funStats.longestMessage.user}</div>
              <div className="text-xs text-gray-400">{stats.funStats.longestMessage.length} caracteres</div>
            </div>
          </div>
        </div>
      </div>

       {/* Achievements */}
       <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🎖️ Logros del Sistema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.achievements.map((badge: any) => (
            <div key={badge.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${badge.unlocked ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}`}>
              <div className="text-4xl mb-2 filter drop-shadow-sm">{badge.icon}</div>
              <div className="font-bold text-gray-800 text-sm mb-1">{badge.title}</div>
              <div className="text-xs text-gray-500">{badge.description}</div>
              {badge.unlocked && <div className="mt-2 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">DESBLOQUEADO</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Message Log - Inserted */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📜 Registro de Mensajes
        </h3>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
               <tr>
                 <th className="p-3 rounded-tl-lg">Fecha</th>
                 <th className="p-3">De</th>
                 <th className="p-3">Para</th>
                 <th className="p-3">Mensaje</th>
                 <th className="p-3 rounded-tr-lg">Tipo</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {messages.map((msg: any) => (
                 <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                   <td className="p-3 text-gray-400 whitespace-nowrap">
                     {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </td>
                   <td className="p-3 font-medium text-purple-600">
                     {msg.fromUser ? msg.fromUser.username : <span className="text-gray-400 italic">Anónimo</span>}
                   </td>
                   <td className="p-3 font-medium text-pink-600">
                     {msg.toName || <span className="text-gray-400">Todos</span>}
                   </td>
                   <td className="p-3 text-gray-700 max-w-xs truncate" title={msg.content}>
                     {msg.content}
                   </td>
                   <td className="p-3">
                     {msg.isPublic ? (
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">Público</span>
                     ) : (
                       <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">Privado</span>
                     )}
                   </td>
                 </tr>
               ))}
               {messages.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-gray-400">
                     No hay mensajes registrados.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
