import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Message } from '../types'

interface MessageCardProps {
  msg: Message
  isAdmin: boolean
  onDelete: (id: string) => void
  onReaction: (id: string, emoji: string) => void
  onView: (msg: Message) => void
  onPlay: (url: string) => void
}

export default function MessageCard({ msg, isAdmin, onDelete, onReaction, onView, onPlay }: MessageCardProps) {

  // Parse Style
  let style = { color: 'bg-yellow-200', rotation: 0, theme: 'pastel' }
  try {
    if (msg.style) style = { ...style, ...JSON.parse(msg.style) }
  } catch (e) { }

  // Theme Mappings
  let cardClasses = `aspect-square p-4 shadow-md rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden text-gray-800 font-handwriting ${style.color}`

  if (style.theme === 'cyberpunk') {
    cardClasses = "aspect-square p-4 shadow-[0_0_15px_rgba(236,72,153,0.5)] rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-slate-900 border-2 border-pink-500 text-cyan-400 font-mono tracking-wide"
  } else if (style.theme === 'retro') {
    cardClasses = "aspect-square p-4 shadow-none rounded-none flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-gray-200 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 font-mono text-gray-900"
  } else if (style.theme === 'vintage') {
    cardClasses = "aspect-square p-8 shadow-inner rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-[#f4e4bc] border border-[#d4c49c] font-serif text-[#5c4b37]"
  } else if (style.theme === 'notebook') {
    cardClasses = "aspect-square p-6 shadow-md flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-white text-gray-800 font-handwriting"
  } else if (style.theme === 'polaroid') {
    cardClasses = "aspect-[3.5/4.2] p-3 pb-12 shadow-md bg-white flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden text-gray-800 transform rotate-1"
  } else if (style.theme === 'newspaper') {
     cardClasses = "aspect-square p-6 shadow-md rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-[#f4f4f4] text-gray-900 font-serif border-double border-4 border-gray-400"
  } else if (style.theme === 'blueprint') {
     cardClasses = "aspect-square p-6 shadow-lg rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-[#1e3a8a] text-blue-100 font-mono border-2 border-dashed border-blue-300"
  } else if (style.theme === 'galaxy') {
     cardClasses = "aspect-square p-6 shadow-lg rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-black text-white border border-purple-500/50"
  }

  const hasGif = !!msg.gifUrl
  const hasSpotify = !!msg.spotifyUrl

  let lineClampClass = 'line-clamp-4'
  if (hasGif && hasSpotify) {
    lineClampClass = 'line-clamp-1'
  } else if (hasGif || hasSpotify) {
    lineClampClass = 'line-clamp-2'
  }

  const paddingClass = (hasGif && hasSpotify) ? 'p-2' : 'p-4'

  return (
    <div
      onClick={() => onView(msg)}
      className={`${cardClasses} ${paddingClass}`}
      style={{ transform: `rotate(${style.rotation}deg)` }}
    >
      {/* Theme Decorations */}
      {style.theme === 'cyberpunk' && (
        <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(255,0,255,.3)_25%,rgba(255,0,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,0,255,.3)_75%,rgba(255,0,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,0,255,.3)_25%,rgba(255,0,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,0,255,.3)_75%,rgba(255,0,255,.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
      )}
      {style.theme === 'notebook' && (
        <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(#0099cc_1px,transparent_1px)] bg-[length:100%_24px] mt-6"></div>
      )}
      {style.theme === 'vintage' && (
        <div className="absolute top-2 right-2 opacity-80 text-red-800 z-10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#a83f39" opacity="0.9" /><path d="M12 6C12 6 7 9 7 13C7 16 9 18 12 18C15 18 17 16 17 13C17 9 12 6 12 6Z" fill="#7a2e2a" /></svg>
        </div>
      )}
      {style.theme === 'retro' && (
        <div className="absolute top-0 left-0 right-0 h-6 bg-blue-800 flex items-center px-1 z-20">
          <span className="text-white text-[10px] uppercase font-bold tracking-wider">Message.exe</span>
        </div>
      )}
      {style.theme === 'newspaper' && (
        <div className="absolute top-0 w-full border-b border-gray-800 mb-2 py-1 bg-gray-200 z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] block w-full">Extra! Extra!</span>
        </div>
      )}
      {style.theme === 'blueprint' && (
          <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(#60a5fa_1px,transparent_1px),linear-gradient(90deg,#60a5fa_1px,transparent_1px)] bg-[length:20px_20px]"></div>
      )}
      {style.theme === 'galaxy' && (
          <div className="absolute inset-0 z-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
      )}

      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }}
          className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-red-500 hover:text-white rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all custom-delete-btn z-50"
          title="Borrar mensaje"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className={`flex-1 flex flex-col items-center cursor-pointer w-full h-full relative z-10 ${style.theme === 'retro' ? 'pt-6' : ''}`}>
        
        {/* GIF */}
        {hasGif && (
          <div className="w-full h-24 shrink-0 rounded-md overflow-hidden bg-black/10 mb-1">
            <img src={msg.gifUrl!} alt="GIF" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Text */}
        <div className={`flex-1 w-full text-sm sm:text-base leading-snug break-words flex items-center justify-center min-h-0 ${style.theme === 'polaroid' ? 'bg-black/5 p-2 rounded' : ''} ${hasSpotify ? 'mb-1' : ''}`}>
          <p className={`${lineClampClass} ${style.theme === 'notebook' ? 'leading-[24px]' : ''}`}>
            {msg.content}
          </p>
        </div>

        {/* Spotify Vinyl Toggle */}
        {hasSpotify && (
          <div 
            className="w-full mt-auto shrink-0 relative z-30 pointer-events-auto flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
             <button 
               onClick={() => onPlay(msg.spotifyUrl!)}
               className="w-12 h-12 rounded-full bg-black border-4 border-gray-800 shadow-lg animate-[spin_4s_linear_infinite] flex items-center justify-center group/vinyl hover:scale-110 transition-transform relative"
               title="Reproducir música"
             >
               {/* Vinyl Groove */}
               <div className="absolute inset-1 rounded-full border border-gray-700 opacity-50"></div>
               <div className="absolute inset-3 rounded-full border border-gray-700 opacity-50"></div>
               {/* Label */}
               <div className="w-4 h-4 rounded-full bg-pink-500 group-hover/vinyl:bg-green-500 transition-colors"></div>
               {/* Shine */}
               <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
             </button>
          </div>
        )}

        {/* Footer info (Para: ...) */}
        <div className={`mt-1 w-full flex justify-between items-end text-xs opacity-70 ${style.theme === 'cyberpunk' ? 'text-green-400' : 'text-gray-800'} shrink-0`}>
           <div className="truncate max-w-full font-medium">Para: {msg.toName || 'Todos'}</div>
           {msg.commentsCount !== undefined && msg.commentsCount > 0 && (
             <div className="flex items-center gap-1 font-bold">
               <span>💬</span> {msg.commentsCount}
             </div>
           )}
        </div>
      </div>

      {/* Reaction Section */}
      <div className={`w-full mt-1 pt-1 border-t shrink-0 ${style.theme === 'cyberpunk' ? 'border-pink-500/30' : 'border-black/5'}`}>
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mb-1">
            {msg.reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); onReaction(msg.id, reaction.emoji); }}
                className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${reaction.userReacted
                  ? 'bg-pink-500 text-white scale-110'
                  : 'bg-white/30 hover:bg-white/60'
                  }`}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
