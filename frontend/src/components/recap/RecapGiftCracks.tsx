import { motion, useReducedMotion } from 'motion/react'

const cracks = [
  { d: 'M210 22 L196 52 L207 72 L184 99', level: 1 },
  { d: 'M197 52 L165 61 L146 84', level: 1 },
  { d: 'M207 72 L236 88 L249 116', level: 2 },
  { d: 'M184 99 L194 124 L169 151', level: 2 },
  { d: 'M165 61 L142 48 L118 55', level: 2 },
  { d: 'M236 88 L273 72 L301 82', level: 3 },
  { d: 'M249 116 L283 132 L295 160', level: 3 },
  { d: 'M169 151 L132 143 L105 164', level: 3 },
  { d: 'M146 84 L112 98 L88 91', level: 3 },
  { d: 'M194 124 L219 151 L210 176', level: 4 },
]

interface RecapGiftCracksProps {
  hits: number
}

export function RecapGiftCracks({ hits }: RecapGiftCracksProps) {
  const reduceMotion = useReducedMotion()

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 size-full" viewBox="0 0 420 180">
      {cracks.map((crack, index) => {
        const visible = hits >= crack.level
        return (
          <motion.path
            animate={{ opacity: visible ? 0.78 : 0, pathLength: visible ? 1 : 0 }}
            d={crack.d}
            fill="none"
            initial={false}
            key={crack.d}
            stroke={index % 3 === 0 ? '#965eeb' : '#433b56'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}
