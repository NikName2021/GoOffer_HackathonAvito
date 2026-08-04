import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const controlClassName =
  'mt-1.5 w-full rounded-xl border border-[#dfe1e3] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition placeholder:text-[#a1a4a7] focus:border-[#00aaff] focus:ring-3 focus:ring-[#00aaff]/15'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FormField({ className, label, ...props }: FormFieldProps) {
  return (
    <label className="block min-w-0 text-xs font-medium text-[#6f7377]">
      {label}
      <input className={cn(controlClassName, className)} {...props} />
    </label>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextareaField({ className, label, ...props }: TextareaFieldProps) {
  return (
    <label className="block text-xs font-medium text-[#6f7377]">
      {label}
      <textarea className={cn(controlClassName, 'min-h-20 resize-y', className)} {...props} />
    </label>
  )
}

interface CheckboxFieldProps {
  checked: boolean
  children: ReactNode
  onChange: (checked: boolean) => void
}

export function CheckboxField({ checked, children, onChange }: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-xs font-medium text-[#1f1f1f]">
      <input
        checked={checked}
        className="size-4 accent-[#00aaff]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {children}
    </label>
  )
}
