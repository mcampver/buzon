export default function ProfileView({ profile }: { profile: any }) {
  if (!profile) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando perfil...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-5xl shadow-inner animate-bounce">
          {profile.level.icon}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <h2 className="text-2xl font-bold text-gray-800">Tu Nivel: <span className="text-pink-600">{profile.level.title}</span></h2>
          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-purple-500 absolute top-0 left-0 transition-all duration-1000 ease-out"
              style={{ width: `${profile.level.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {profile.personalStats.messagesSent} mensajes enviados • Sigue enviando para subir de nivel!
          </p>
        </div>
        <div className="text-center bg-orange-50 p-3 rounded-xl border border-orange-100">
           <div className="text-2xl font-bold text-orange-600">{profile.streak} 🔥</div>
           <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Racha Días</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">📨</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.messagesSent}</div>
          <div className="text-xs text-gray-500">Enviados</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">💌</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.messagesReceived}</div>
          <div className="text-xs text-gray-500">Recibidos</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">❤️</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.reactionsReceived}</div>
          <div className="text-xs text-gray-500">Reacciones</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.mostPopularMessage?.reactions || 0}</div>
          <div className="text-xs text-gray-500">Max Reacciones</div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          🏅 Tus Medallas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.badges.map((badge: any) => (
             <div key={badge.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${badge.unlocked ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-sm transform hover:scale-105' : 'bg-gray-50 border-gray-200 opacity-50 grayscale'}`}>
              <div className="text-4xl mb-2 drop-shadow-sm">{badge.icon}</div>
              <div className="font-bold text-gray-800 text-sm">{badge.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
