import { Plus, RotateCw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { CardDefinitionCard } from "@/components/admin/CardDefinitionCard";
import { CardDefinitionDialog } from "@/components/admin/CardDefinitionDialog";
import { DeleteCardDefinitionDialog } from "@/components/admin/DeleteCardDefinitionDialog";
import { AchievementDefinitionsSection } from "@/components/admin/AchievementDefinitionsSection";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Button } from "@/components/ui/button";
import {
  useCardDefinitionOptions,
  useCardDefinitions,
  useCreateCardDefinition,
  useDeleteCardDefinition,
  useUpdateCardDefinition,
} from "@/hooks/useCardDefinitions";
import { useProfiles } from "@/hooks/useProfiles";
import { useAppSelector } from "@/store/hooks";
import type {
  CardDefinition,
  CardDefinitionRequest,
} from "@/types/cardDefinition.type";

export function RecapSettingsPage() {
  const account = useAppSelector((state) => state.auth.account);
  const isAdmin = Boolean(account?.isAdmin);
  const definitionsQuery = useCardDefinitions(isAdmin);
  const optionsQuery = useCardDefinitionOptions(isAdmin);
  const profilesQuery = useProfiles(account?.id);
  const createMutation = useCreateCardDefinition();
  const updateMutation = useUpdateCardDefinition();
  const deleteMutation = useDeleteCardDefinition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CardDefinition | null>(null);
  const [deleting, setDeleting] = useState<CardDefinition | null>(null);
  const definitions = definitionsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];

  function openCreate() {
    createMutation.reset();
    setCreating(true);
  }

  function openEdit(definition: CardDefinition) {
    updateMutation.reset();
    setEditing(definition);
  }

  async function save(definition: CardDefinitionRequest) {
    if (editing)
      await updateMutation.mutateAsync({ definition, id: editing.id });
    else await createMutation.mutateAsync(definition);
  }

  const formError = (
    editing ? updateMutation.error : createMutation.error
  ) as Error | null;

  return (
    <div className="flex min-h-dvh bg-white text-[#1f1f1f]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1120px]">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-[#00aaff]">
                <SlidersHorizontal className="size-4" />
                Администрирование
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                Настройка итогов года
              </h1>
            </div>
            <Button
              className="h-11 bg-[#00aaff] px-5 text-white hover:bg-[#0099e6]"
              disabled={!optionsQuery.data}
              onClick={openCreate}
            >
              <Plus />
              Новое достижение
            </Button>
          </header>
          <section className="mt-10" aria-labelledby="card-definitions-heading">
            <h2
              className="text-2xl font-black tracking-[-0.02em]"
              id="card-definitions-heading"
            >
              Дополнительные достижения
            </h2>
            <p className="mt-1 text-sm text-[#6f7377]">
              Создавайте дополнительные персональные достижения для следующих
              итогов.
            </p>
                      {definitionsQuery.isPending && (
            <SettingsNotice text="Загружаем настройки…" />
          )}
          {definitionsQuery.isError && (
            <SettingsNotice
              action={() => void definitionsQuery.refetch()}
              text={definitionsQuery.error.message}
            />
          )}
          {definitionsQuery.isSuccess && definitions.length === 0 && (
            <SettingsNotice text="Настроек пока нет. Создайте первое достижение итогов года." />
          )}
            {definitions.length > 0 && (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {definitions.map((definition) => (
                  <CardDefinitionCard
                    definition={definition}
                    key={definition.id}
                    onDelete={(item) => {
                      deleteMutation.reset();
                      setDeleting(item);
                    }}
                    onEdit={openEdit}
                    profileName={
                      profiles.find(
                        (profile) => profile.id === definition.target_user_id,
                      )?.name
                    }
                  />
                ))}
              </div>
            )}
          </section>
          <AchievementDefinitionsSection enabled={isAdmin} />
        </div>
      </main>

      {optionsQuery.data && (creating || editing) && (
        <CardDefinitionDialog
          definition={editing}
          error={formError?.message}
          key={editing?.id ?? "create"}
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          onSubmit={save}
          open
          options={optionsQuery.data}
          profiles={profiles}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
      <DeleteCardDefinitionDialog
        definition={deleting}
        error={deleteMutation.error?.message}
        isDeleting={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting.id);
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}

function SettingsNotice({
  action,
  text,
}: {
  action?: () => void;
  text: string;
}) {
  return (
    <div className="mt-8 rounded-3xl border border-[#e7e9eb] bg-[#f7fcff] p-8 text-center text-sm text-[#6f7377]">
      <p>{text}</p>
      {action && (
        <Button
          className="mt-3 text-[#00aaff]"
          onClick={action}
          variant="ghost"
        >
          <RotateCw />
          Повторить
        </Button>
      )}
    </div>
  );
}
