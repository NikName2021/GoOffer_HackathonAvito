import { useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react'

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string
}

export function ImageWithFallback({
  fallbackSrc,
  onError,
  src,
  ...props
}: ImageWithFallbackProps) {
  const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(() => new Set())
  const primarySrc = typeof src === 'string' ? src : undefined
  const resolvedSrc =
    primarySrc && !failedSources.has(primarySrc)
      ? primarySrc
      : fallbackSrc && !failedSources.has(fallbackSrc)
        ? fallbackSrc
        : undefined

  if (!resolvedSrc) return null

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    setFailedSources((current) => new Set(current).add(resolvedSrc as string))
    onError?.(event)
  }

  return (
    <img
      {...props}
      data-fallback-active={resolvedSrc === fallbackSrc ? 'true' : undefined}
      onError={handleError}
      src={resolvedSrc}
    />
  )
}
