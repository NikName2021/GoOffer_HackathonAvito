import { CheckboxField, DefinitionSelect, TextAreaField, TextField } from './CardDefinitionControls'
import { CardIconPicker } from './CardIconPicker'
import { RecapIcon } from '@/components/recap/RecapIcon'
import { cardLayoutLabels, cardThemes } from '@/constants/cardDefinitionOptions'
import type { CardDefinitionOptions, CardDefinitionRequest, CardLayout } from '@/types/cardDefinition.type'

interface CardDefinitionAppearanceFieldsProps {
  definition: CardDefinitionRequest
  onChange: (definition: CardDefinitionRequest) => void
  options: CardDefinitionOptions
}

export function CardDefinitionAppearanceFields({ definition, onChange, options }: CardDefinitionAppearanceFieldsProps) {
  const selectedTheme = cardThemes.find((theme) => theme.value === definition.theme) ?? cardThemes[2]

  return (
    <section className="grid gap-4 rounded-3xl border border-[#e7e9eb] p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Заголовок карточки"
          maxLength={160}
          onChange={(event) => onChange({ ...definition, title: event.target.value })}
          placeholder="Вы активно искали"
          required
          value={definition.title}
        />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField
          label="Описание"
          maxLength={500}
          onChange={(event) => onChange({ ...definition, description: event.target.value })}
          placeholder="Коротко объясните результат пользователю"
          value={definition.description}
        />
      </div>
      <TextField
        label="Подпись после значения"
        maxLength={40}
        onChange={(event) => onChange({ ...definition, value_suffix: event.target.value })}
        placeholder="просмотров"
        value={definition.value_suffix}
      />
      <TextField
        label="Порядок показа"
        min={0}
        onChange={(event) => onChange({ ...definition, sort_order: Number(event.target.value) })}
        required
        type="number"
        value={definition.sort_order}
      />
      <DefinitionSelect<CardLayout>
        label="Размер"
        onChange={(layout) => onChange({ ...definition, layout })}
        options={options.layouts.map((value) => ({ label: cardLayoutLabels[value], value }))}
        value={definition.layout}
      />
      <DefinitionSelect
        label="Цвет"
        onChange={(theme) => onChange({ ...definition, theme })}
        options={cardThemes.map(({ label, value }) => ({ label, value }))}
        value={definition.theme}
      />
      <CardIconPicker
        onChange={(icon) => onChange({ ...definition, icon })}
        value={definition.icon}
      />
      <div
        className="flex items-center gap-3 rounded-2xl px-3 py-2"
        style={{ backgroundColor: `${selectedTheme.color}16` }}
      >
        <span className="grid size-10 place-items-center rounded-xl bg-white" style={{ color: selectedTheme.color }}>
          <RecapIcon name={definition.icon} />
        </span>
        <span className="text-xs font-semibold text-[#6f7377]">Предпросмотр оформления</span>
      </div>
      <CheckboxField
        checked={definition.shareable}
        label="Можно делиться карточкой"
        onChange={(event) => onChange({ ...definition, shareable: event.target.checked })}
      />
      <CheckboxField
        checked={definition.is_active}
        label="Настройка активна"
        onChange={(event) => onChange({ ...definition, is_active: event.target.checked })}
      />
    </section>
  )
}
