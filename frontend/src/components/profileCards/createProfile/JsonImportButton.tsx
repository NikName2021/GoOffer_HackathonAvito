import { Download, FileUp } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

interface JsonExampleLink {
  href: string
  label: string
}

interface JsonImportButtonProps<T> {
  examples?: JsonExampleLink[]
  onImport: (items: T[]) => void
  parse: (text: string) => T[]
}

export function JsonImportButton<T>({ examples = [], onImport, parse }: JsonImportButtonProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const items = parse(await file.text())
      onImport(items)
      setIsError(false)
      setMessage(`Загружено: ${items.length}`)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Не удалось прочитать JSON-файл.')
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {examples.map((example) => (
          <a
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#00aaff] transition hover:bg-[#e8f6ff]"
            download
            href={example.href}
            key={example.href}
          >
            <Download aria-hidden="true" className="size-4" />
            {example.label}
          </a>
        ))}
        <button
          className="inline-flex items-center gap-1.5 rounded-full border border-[#00aaff] px-3 py-2 text-xs font-semibold text-[#00aaff] transition hover:bg-[#e8f6ff]"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <FileUp aria-hidden="true" className="size-4" />
          Загрузить JSON
        </button>
      </div>
      <input ref={inputRef} accept="application/json,.json" className="sr-only" onChange={handleFile} type="file" />
      {message && (
        <p className={`absolute top-full right-0 z-10 mt-1 w-64 rounded-xl bg-white px-3 py-2 text-right text-[11px] shadow-lg ${isError ? 'text-[#ff4053]' : 'text-[#00a84e]'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
