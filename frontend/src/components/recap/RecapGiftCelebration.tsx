import { AnimatePresence, motion } from 'motion/react'

const confettiColors = ['#00aaff', '#965eeb', '#00c565', '#ff4053', '#ff9f1a']

interface RecapGiftCelebrationProps {
  opening: boolean
}

export function RecapGiftCelebration({ opening }: RecapGiftCelebrationProps) {
  return (
    <AnimatePresence>
      {opening &&
        Array.from({ length: 14 }, (_, index) => (
          <motion.i
            animate={{
              opacity: [0, 1, 0],
              rotate: index * 55,
              x: Math.cos(index) * (110 + index * 8),
              y: -90 - (index % 5) * 38,
            }}
            className="absolute top-1/2 left-1/2 z-40 h-3 w-2 rounded-sm"
            initial={{ opacity: 0, x: 0, y: 0 }}
            key={index}
            style={{ backgroundColor: confettiColors[index % confettiColors.length] }}
            transition={{ delay: index * 0.015, duration: 0.85, ease: 'easeOut' }}
          />
        ))}
    </AnimatePresence>
  )
}
