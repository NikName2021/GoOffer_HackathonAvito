import { DefinitionSelect, TextField } from './CardDefinitionControls'
import {
  cardAnalysisLabels,
  cardConditionLabels,
  cardKindLabels,
  cardMetricLabels,
} from '@/constants/cardDefinitionOptions'
import type {
  CardAnalysis,
  CardCondition,
  CardDefinitionKind,
  CardDefinitionOptions,
  CardDefinitionRequest,
  CardMetric,
} from '@/types/cardDefinition.type'
import type { GetProfileResponse } from '@/types/profileResponse.type'

interface CardDefinitionRuleFieldsProps {
  definition: CardDefinitionRequest
  onChange: (definition: CardDefinitionRequest) => void
  options: CardDefinitionOptions
  profiles: GetProfileResponse[]
}

export function CardDefinitionRuleFields({ definition, onChange, options, profiles }: CardDefinitionRuleFieldsProps) {
  const analysisOptions = options.analyses.filter(
    (analysis) => analysis === 'total' || options.monthly_metrics.includes(definition.metric),
  )

  function changeMetric(metric: CardMetric) {
    const analysis = options.monthly_metrics.includes(metric) ? definition.analysis : 'total'
    onChange({ ...definition, analysis, metric })
  }

  function changeCondition(condition_operator: CardCondition) {
    onChange({
      ...definition,
      condition_operator,
      condition_value: condition_operator === 'always' ? undefined : (definition.condition_value ?? 1),
    })
  }

  return (
    <section className="grid gap-4 rounded-3xl bg-[#f7fcff] p-4 sm:grid-cols-2">
      <TextField
        label="Название настройки"
        maxLength={100}
        onChange={(event) => onChange({ ...definition, name: event.target.value })}
        placeholder="Активный покупатель"
        required
        value={definition.name}
      />
      <DefinitionSelect
        label="Для кого"
        onChange={(target_user_id) =>
          onChange({ ...definition, target_user_id: target_user_id === 'all' ? undefined : target_user_id })
        }
        options={[
          { label: 'Для всех профилей', value: 'all' },
          ...profiles.map((profile) => ({ label: profile.name, value: profile.id })),
        ]}
        value={definition.target_user_id ?? 'all'}
      />
      <DefinitionSelect<CardDefinitionKind>
        label="Тип карточки"
        onChange={(kind) => onChange({ ...definition, kind, layout: kind === 'highlight' ? 'hero' : 'statistic' })}
        options={options.kinds.map((value) => ({ label: cardKindLabels[value], value }))}
        value={definition.kind}
      />
      <DefinitionSelect<CardMetric>
        label="Метрика"
        onChange={changeMetric}
        options={options.metrics.map((value) => ({ label: cardMetricLabels[value], value }))}
        value={definition.metric}
      />
      <DefinitionSelect<CardAnalysis>
        label="Как считать"
        onChange={(analysis) => onChange({ ...definition, analysis })}
        options={analysisOptions.map((value) => ({ label: cardAnalysisLabels[value], value }))}
        value={definition.analysis}
      />
      <DefinitionSelect<CardCondition>
        label="Условие показа"
        onChange={changeCondition}
        options={options.conditions.map((value) => ({ label: cardConditionLabels[value], value }))}
        value={definition.condition_operator}
      />
      {definition.condition_operator !== 'always' && (
        <TextField
          label="Пороговое значение"
          min={0}
          onChange={(event) =>
            onChange({
              ...definition,
              condition_value: event.target.value === '' ? undefined : event.target.valueAsNumber,
            })
          }
          required
          step="any"
          type="number"
          value={definition.condition_value ?? ''}
        />
      )}
    </section>
  )
}
