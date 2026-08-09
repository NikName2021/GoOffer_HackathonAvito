import {
  ArrowUpRight,
  CalendarDays,
  Compass,
  Eye,
  Heart,
  Megaphone,
  MessageCircle,
  Recycle,
  Repeat2,
  Shapes,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Truck,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  arrow: ArrowUpRight,
  bag: ShoppingBag,
  chart: Shapes,
  calendar: CalendarDays,
  categories: Shapes,
  compass: Compass,
  eye: Eye,
  heart: Heart,
  megaphone: Megaphone,
  message: MessageCircle,
  recycle: Recycle,
  review: Star,
  sparkles: Sparkles,
  star: Star,
  switch: Repeat2,
  trophy: Trophy,
  delivery: Truck,
}

interface RecapIconProps {
  name: string
}

export function RecapIcon({ name }: RecapIconProps) {
  const Icon = icons[name] ?? Sparkles
  return <Icon aria-hidden="true" className="size-7 sm:size-8" strokeWidth={2.1} />
}
