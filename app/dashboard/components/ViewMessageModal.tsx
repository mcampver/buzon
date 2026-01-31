import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Send } from 'lucide-react'
import { Message } from '../types'

interface ViewMessageModalProps {
  message: Message
  onClose: () => void
}

export default function ViewMessageModal({ message, onClose }: ViewMessageModalProps) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/comments?messageId=${message.id}`)
        if (res.ok) {
           setComments(await res.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [message.id])

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageId: message.id, 
          content: newComment,
          isAnonymous
        })
      })
      
      if (res.ok) {
        const savedComment = await res.json()
        setComments([...comments, savedComment])
        setNewComment('')
        setIsAnonymous(false) // Reset
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Message Content */}
        <div className={`p-8 relative ${message.style ? JSON.parse(message.style).color : 'bg-gray-100'} min-h-[200px] flex flex-col justify-center text-center`}>
           <button onClick={onClose} className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors z-10">
            <X size={20} className="text-gray-800" />
          </button>
          
          <p className="font-handwriting text-3xl leading-snug text-gray-900 mb-4 break-words whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Spotify Player in Detail View */}
          {message.spotifyUrl && (
             <div className="w-full mb-4 h-[80px] shrink-0">
               <iframe 
                 src={(function(url){
                    try {
                      const match = url.match(/\/track\/([a-zA-Z0-9]+)/)
                      if (match && match[1]) return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator`
                      return url
                    } catch (e) { return url }
                 })(message.spotifyUrl)} 
                 width="100%" 
                 height="100%" 
                 frameBorder="0" 
                 allow="encrypted-media" 
                 className="rounded-xl shadow-sm bg-white/20"
               ></iframe>
             </div>
          )}

          <div className="mt-auto pt-4 border-t border-black/10 w-full flex justify-between items-end text-sm text-gray-800 font-medium opacity-80">
            <div className="text-left">
              <span className="block text-xs uppercase tracking-wider opacity-60">Para</span>
              {message.toName || 'Todos (Muro)'}
            </div>
            <div className="text-right">
               <span className="block text-xs uppercase tracking-wider opacity-60">Enviado</span>
               {new Date(message.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
           <div className="p-4 space-y-4">
             <h4 className="font-bold text-gray-700 flex items-center gap-2">
               💬 Comentarios ({comments.length})
             </h4>

             {loading ? (
               <div className="text-center py-8 text-gray-400">Cargando chismes...</div>
             ) : comments.length === 0 ? (
               <div className="text-center py-8 text-gray-400 italic">Nadie ha dicho nada aún. ¡Sé el primero!</div>
             ) : (
               <div className="space-y-3">
                 {comments.map((comment) => (
                   <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-1">
                       <span className="font-bold text-sm text-pink-600">
                         {comment.user.username} 
                         {comment.user.department && <span className="text-gray-400 font-normal text-xs ml-1">({comment.user.department})</span>}
                       </span>
                       <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                     </div>
                     <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Add Comment Input */}
        <form onSubmit={handleSendComment} className="p-4 bg-white border-t border-gray-200">
           <div className="flex items-center gap-2 mb-2">
             <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-pink-600 transition-colors">
               <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isAnonymous ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 bg-white'}`}>
                 {isAnonymous && <Check size={10} strokeWidth={4} />}
               </div>
               <input 
                  type="checkbox" 
                  checked={isAnonymous} 
                  onChange={(e) => setIsAnonymous(e.target.checked)} 
                  className="hidden" 
                />
               <span>Comentar como Anónimo 👻</span>
             </label>
           </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAnonymous ? "Escribe un comentario anónimo..." : "Escribe un comentario..."}
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-sm"
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={sending || !newComment.trim()}
              className="bg-pink-600 text-white p-2 rounded-full hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
