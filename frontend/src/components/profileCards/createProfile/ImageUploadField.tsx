import { ImagePlus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface ImageUploadFieldProps {
  label: string
  onChange: (imageUrl?: string) => void
  value?: string
}

export function ImageUploadField({ label, onChange, value }: ImageUploadFieldProps) {
  const [error, setError] = useState('')

  function handleFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Выберите изображение')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла — не более 5 МБ')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
        setError('')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6f7377]">{label}</p>
      <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-dashed border-[#cfd2d5] bg-[#fafafa] p-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#e8f6ff] text-[#00aaff]">
          {value ? (
            <ImageWithFallback alt="Предпросмотр" className="size-full object-cover" src={value} />
          ) : (
            <ImagePlus aria-hidden="true" className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer rounded-full bg-[#00aaff] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0099e6]">
            Прикрепить фото
            <input
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
              type="file"
            />
          </label>
          <p className="mt-1 text-[10px] text-[#8a8d91]">PNG, JPG или WEBP до 5 МБ</p>
        </div>
        {value && (
          <button
            aria-label="Удалить изображение"
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#8a8d91] hover:bg-[#fff0f2] hover:text-[#ff4053]"
            onClick={() => onChange(undefined)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-[#ff4053]">{error}</p>}
    </div>
  )
}
