import { CalendarCheck, Eye, Heart, Repeat2 } from 'lucide-react'
import { motion } from 'motion/react'

import type { RecapResponse } from '@/types/recap.type'

interface RecapOverviewMetricsProps {
  recap: RecapResponse
}

export function RecapOverviewMetrics({ recap }: RecapOverviewMetricsProps) {
  const metrics = [
    { icon: Eye, label: 'Просмотры', value: recap.total_views },
    { icon: Heart, label: 'Избранное', value: recap.total_favorites },
    { icon: Repeat2, label: 'Сделки', value: recap.total_purchases + recap.total_sales },
    { icon: CalendarCheck, label: 'Активных дней', value: recap.activity_days },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {metrics.map(({ icon: Icon, label, value }) => (
        <motion.div className="group rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur-xl" key={label} whileHover={{ scale: 1.035, y: -4 }}>
          <Icon aria-hidden="true" className="size-4 text-[#00aaff]" />
          <p className="mt-2 text-lg font-black sm:text-xl">{value.toLocaleString('ru-RU')}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[#6f7377] sm:text-xs">{label}</p>
        </motion.div>
      ))}
    </div>
  )
}
