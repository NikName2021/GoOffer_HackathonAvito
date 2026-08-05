import { FileJson, LoaderCircle } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

import { parseProfilesJson } from './parseProfilesJson'
import { useCreateProfiles } from '@/hooks/useProfiles'

interface BulkProfilesImportButtonProps {
  accountId: string
}

export function BulkProfilesImportButton({ accountId }: BulkProfilesImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const mutation = useCreateProfiles(accountId)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const profiles = parseProfilesJson(await file.text())
      const result = await mutation.mutateAsync(profiles)
      const firstError = result.errors[0]
      setIsError(result.errors.length > 0)
      setMessage(
        result.errors.length === 0
          ? `Создано профилей: ${result.created.length}.`
          : `Создано: ${result.created.length}. Ошибок: ${result.errors.length}. Профиль ${firstError.index + 1}: ${firstError.message}`,
      )
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Не удалось импортировать профили.')
    }
  }

  return (
    <div className="col-span-full flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a className="rounded-xl px-3 py-2.5 text-xs font-semibold text-[#00aaff] hover:bg-[#e8f6ff]" download href="/examples/profiles-bulk-example.json">
          Скачать пример JSON
        </a>
        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#00aaff] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0099e6] disabled:cursor-wait disabled:opacity-60"
          disabled={mutation.isPending}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <FileJson className="size-4" />}
          {mutation.isPending ? 'Создаём профили…' : 'Загрузить профили JSON'}
        </button>
      </div>
      <input ref={inputRef} accept="application/json,.json" className="sr-only" onChange={handleFile} type="file" />
      {message && <p className={`max-w-xl text-right text-xs ${isError ? 'text-[#ff4053]' : 'text-[#00a84e]'}`}>{message}</p>}
    </div>
  )
}
