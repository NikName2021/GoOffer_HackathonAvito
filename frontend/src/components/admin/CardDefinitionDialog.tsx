import { useState, type FormEvent } from "react";

import { CardDefinitionAppearanceFields } from "./CardDefinitionAppearanceFields";
import { CardDefinitionRuleFields } from "./CardDefinitionRuleFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CardDefinition,
  CardDefinitionOptions,
  CardDefinitionRequest,
} from "@/types/cardDefinition.type";
import type { GetProfileResponse } from "@/types/profileResponse.type";

const emptyDefinition: CardDefinitionRequest = {
  analysis: "total",
  condition_operator: "always",
  description: "",
  icon: "chart",
  is_active: true,
  kind: "statistic",
  layout: "statistic",
  metric: "total_views",
  name: "",
  shareable: true,
  sort_order: 100,
  theme: "avito-purple",
  title: "",
  value_suffix: "",
};

function toRequest(definition: CardDefinition): CardDefinitionRequest {
  return {
    analysis: definition.analysis,
    condition_operator: definition.condition_operator,
    condition_value: definition.condition_value,
    description: definition.description,
    icon: definition.icon,
    is_active: definition.is_active,
    kind: definition.kind,
    layout: definition.layout,
    metric: definition.metric,
    name: definition.name,
    shareable: definition.shareable,
    sort_order: definition.sort_order,
    target_user_id: definition.target_user_id,
    theme: definition.theme,
    title: definition.title,
    value_suffix: definition.value_suffix,
  };
}

interface CardDefinitionDialogProps {
  definition: CardDefinition | null;
  error?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (definition: CardDefinitionRequest) => Promise<void>;
  open: boolean;
  options: CardDefinitionOptions;
  profiles: GetProfileResponse[];
  submitting: boolean;
}

export function CardDefinitionDialog({
  definition: initialDefinition,
  error,
  onOpenChange,
  onSubmit,
  open,
  options,
  profiles,
  submitting,
}: CardDefinitionDialogProps) {
  const [definition, setDefinition] = useState<CardDefinitionRequest>(
    initialDefinition ? toRequest(initialDefinition) : emptyDefinition,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit(definition);
      onOpenChange(false);
    } catch {
      // Ошибка остаётся в состоянии React Query, поэтому форма не закрывается.
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-4xl sm:p-7">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-2xl font-black text-[#1f1f1f]">
            {initialDefinition
              ? "Редактировать карточку"
              : "Новая карточка итогов"}
          </DialogTitle>
          <DialogDescription>
            Настройте правило, по которому backend добавит персональную карточку
            в следующие итоги года.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <CardDefinitionRuleFields
            definition={definition}
            onChange={setDefinition}
            options={options}
            profiles={profiles}
          />
          <CardDefinitionAppearanceFields
            definition={definition}
            onChange={setDefinition}
            options={options}
          />
          <DialogFooter className="sticky bottom-0 -mx-1 border-t border-[#eceeef] bg-white px-1 pt-4">
            {error && (
              <p className="mr-auto self-center text-xs text-[#ff4053]">
                {error}
              </p>
            )}
            <Button
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Отмена
            </Button>
            <Button
              className="bg-[#00aaff] text-white hover:bg-[#0099e6]"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
