import { useState } from 'react'
import { motion } from 'framer-motion'

interface TourGuideProps {
  onComplete: () => void
}

export default function TourGuide({ onComplete }: TourGuideProps) {
  const [step, setStep] = useState(0)
  
  const steps = [
    {
      title: "¡Bienvenido al Buzón del Amor! 💘",
      content: "Aquí podrás compartir mensajes anónimos (o no) con tus compañeros de clase. ¡Prepárate para el 14 de Febrero!",
      target: "body", 
    },
    {
      title: "El Muro 🧱",
      content: "Aquí verás los mensajes públicos. Puedes explorarlos y ver qué dice la gente.",
      target: "button[data-tab='wall']", 
    },
    {
      title: "Reacciona y Responde ❤️",
      content: "¡No seas tímido! Dale amor a las cartas con emojis y haz clic en ellas para dejar un comentario (anónimo si quieres 👻).",
      target: "body", // General focus
    },
    {
      title: "Tu Buzón 💌",
      content: "Los mensajes privados que recibas aparecerán aquí. ¡Solo sus ojos pueden verlos!",
      target: "button[data-tab='inbox']", 
    },
    {
      title: "¡Exprésate! ✍️",
      content: "Usa este botón para escribir una carta nueva. Elige el estilo, destinatario y si quieres mantener el secreto.",
      target: "button[aria-label='Escribir carta']", 
    },
    {
      title: "Tu Perfil 👤",
      content: "Mira tus estadísticas, medallas y sube de nivel. ¿Serás el próximo Cupido?",
      target: "button[data-tab='profile']", 
    }
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  // Floating emojis for background effect
  const floatingEmojis = ['❤️', '💘', '💌', '✨', '🌹', '🍫']

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-hidden">
      {/* Background Anime Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmojis.map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ y: '100vh', x: Math.random() * 100 + 'vw', opacity: 0 }}
            animate={{ 
              y: '-100vh', 
              opacity: [0, 1, 0],
              rotate: [0, 360],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute text-4xl opacity-20"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div 
        key={step}
        initial={{ opacity: 0, scale: 0.8, y: 50, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50, rotate: 5 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden text-center border-4 border-pink-200"
      >
        {/* Decorative Circles */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="mb-6">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
               transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
               className="text-6xl mb-4 inline-block drop-shadow-md"
             >
               {currentStep.title.split(' ').pop()}
             </motion.div>
             <h3 className="text-2xl font-black text-gray-800 mb-3 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
               {currentStep.title}
             </h3>
             <p className="text-gray-600 font-medium leading-relaxed">
               {currentStep.content}
             </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2.5 rounded-full"
              initial={{ width: `${(step / steps.length) * 100}%` }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex justify-between items-center">
            <button 
               onClick={onComplete}
               className="text-gray-400 hover:text-gray-600 text-sm font-semibold underline decoration-dotted"
            >
               Saltar
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2 group"
            >
              {step === steps.length - 1 ? '¡Vamos! 🚀' : <span>Siguiente <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
