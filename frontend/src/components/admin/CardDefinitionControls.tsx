import type { ChangeEventHandler, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const controlClass =
  'mt-1.5 w-full rounded-xl border border-[#dfe1e3] bg-white px-3 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[#00aaff] focus:ring-3 focus:ring-[#00aaff]/15'

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-semibold text-[#6f7377]">{children}</label>
}

export function TextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <FieldLabel>
      {label}
      <input className={controlClass} {...props} />
    </FieldLabel>
  )
}

export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <FieldLabel>
      {label}
      <textarea className={`${controlClass} min-h-20 resize-y`} {...props} />
    </FieldLabel>
  )
}

interface DefinitionSelectProps<T extends string> {
  label: string
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  value: T
}

export function DefinitionSelect<T extends string>({ label, onChange, options, value }: DefinitionSelectProps<T>) {
  function change(nextValue: T | null) {
    if (nextValue) onChange(nextValue)
  }

  return (
    <FieldLabel>
      {label}
      <Select items={options} onValueChange={change} value={value}>
        <SelectTrigger className="mt-1.5 h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldLabel>
  )
}

export function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: ChangeEventHandler<HTMLInputElement>
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-[#f7f8f9] px-3 py-2.5 text-sm font-medium text-[#1f1f1f]">
      <input checked={checked} className="size-4 accent-[#00aaff]" onChange={onChange} type="checkbox" />
      {label}
    </label>
  )
}
