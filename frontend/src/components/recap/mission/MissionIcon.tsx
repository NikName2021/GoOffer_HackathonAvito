import { Heart, PackageCheck, Recycle, Truck } from 'lucide-react'

interface MissionIconProps {
  name: string
  className?: string
}

export function MissionIcon({ className, name }: MissionIconProps) {
  const normalizedName = name.toLowerCase()
  const Icon = normalizedName.includes('heart')
    ? Heart
    : normalizedName.includes('delivery') || normalizedName.includes('truck')
      ? Truck
      : normalizedName.includes('recycle')
        ? Recycle
        : PackageCheck

  return <Icon aria-hidden="true" className={className} />
}
