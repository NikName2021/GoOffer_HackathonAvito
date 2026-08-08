import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react'

import { cn } from '@/lib/utils'

interface RecapSceneBackgroundProps {
  glow: string
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
}

export function RecapSceneBackground({ glow, pointerX, pointerY }: RecapSceneBackgroundProps) {
  const reduceMotion = useReducedMotion()
  const orbX = useTransform(pointerX, [-1, 1], [-36, 36])
  const orbY = useTransform(pointerY, [-1, 1], [-26, 26])
  const ringX = useTransform(pointerX, [-1, 1], [24, -24])
  const ringY = useTransform(pointerY, [-1, 1], [18, -18])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
      <motion.div className={cn('absolute -top-24 -right-20 size-80 rounded-full opacity-20 blur-3xl', glow)} style={{ x: orbX, y: orbY }} />
      <motion.div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-white/60 blur-2xl" style={{ x: ringX, y: ringY }} />
      <motion.div
        animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.08, 1] }}
        className="absolute top-[12%] right-[8%] size-44 rounded-[38%] border border-white/70 bg-white/20 shadow-[inset_0_0_40px_rgba(255,255,255,0.5)] backdrop-blur-sm"
        style={{ x: ringX, y: orbY }}
        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
      />
      <motion.div animate={reduceMotion ? undefined : { rotate: [12, 22, 12], y: [0, -14, 0] }} className="absolute right-[8%] bottom-[18%] h-20 w-28 rounded-3xl border border-white/70 bg-white/35 shadow-lg backdrop-blur-md" transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}>
        <span className="absolute top-4 left-4 size-3 rounded-full bg-[#00aaff]" />
        <span className="absolute top-4 left-9 size-3 rounded-full bg-[#ff4053]" />
        <span className="absolute right-4 bottom-4 text-xl font-black text-[#965eeb]">∞</span>
      </motion.div>
      {Array.from({ length: 8 }, (_, index) => (
        <motion.i
          animate={reduceMotion ? undefined : { opacity: [0.2, 0.75, 0.2], y: [0, index % 2 ? 14 : -14, 0] }}
          className={cn('absolute size-2 rounded-full', index % 3 === 0 ? 'bg-[#ff4053]' : index % 3 === 1 ? 'bg-[#00aaff]' : 'bg-[#00c565]')}
          key={index}
          style={{ left: `${8 + index * 11}%`, top: `${15 + (index % 4) * 20}%` }}
          transition={{ delay: index * 0.18, duration: 3.5 + index * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  )
}
