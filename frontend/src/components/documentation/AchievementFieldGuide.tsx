import { Settings2 } from "lucide-react";

import { AchievementOptionsGuide } from "./AchievementOptionsGuide";

const ruleFields = [
  [
    "Название настройки",
    "Имя правила в списке настроек и подпись над заголовком итоговой карточки.",
  ],
  [
    "Для кого",
    "Применить правило ко всем профилям или только к одному выбранному профилю.",
  ],
  [
    "Тип карточки",
    "«Статистика» — обычная карточка, «Главный момент» — крупный акцентный слайд.",
  ],
  [
    "Метрика",
    "Числовой показатель профиля, который backend рассчитает за выбранный год.",
  ],
  [
    "Как считать",
    "Взять годовой итог, среднее за 12 месяцев или максимальное значение одного месяца.",
  ],
  ["Условие показа", "Правило сравнения рассчитанного результата с порогом."],
  [
    "Пороговое значение",
    "Число для сравнения. Появляется для всех условий, кроме «Показывать всегда».",
  ],
] as const;

const appearanceFields = [
  [
    "Заголовок карточки",
    "Главная фраза, которую пользователь увидит на слайде итогов.",
  ],
  [
    "Описание",
    "Пояснение результата: почему этот факт важен и что было посчитано.",
  ],
  [
    "Подпись после значения",
    "Единица после числа, например «покупок», «дней» или «просмотров».",
  ],
  [
    "Порядок показа",
    "Приоритет среди настраиваемых карточек: чем меньше число, тем раньше карточка.",
  ],
  [
    "Размер",
    "Компактная карточка показывает факт короче, большая занимает акцентный слайд.",
  ],
  ["Цвет", "Цветовая тема фона и декоративных элементов карточки."],
  [
    "Иконка",
    "Визуальный символ, который помогает быстро распознать смысл достижения.",
  ],
  [
    "Можно делиться",
    "Разрешает включать карточку в выбор для экспорта и безопасного share-ответа.",
  ],
  [
    "Настройка активна",
    "Только активные правила участвуют в следующей генерации итогов года.",
  ],
] as const;

export function AchievementFieldGuide() {
  return (
    <section
      id="achievement-fields"
      className="rounded-[32px] bg-[#f7fcff] p-5 sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#00aaff] text-white">
          <Settings2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#00aaff]">
            Справочник администратора
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            Поля конструктора ачивок
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f7377]">
            Сначала выбирается, что считать и когда показывать результат, затем
            настраивается текст и внешний вид.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FieldGroup fields={ruleFields} title="Правило и аудитория" />
        <FieldGroup fields={appearanceFields} title="Содержание и оформление" />
      </div>
      <AchievementOptionsGuide />

      <aside className="mt-5 rounded-3xl bg-[#e7faef] p-5 text-sm leading-6">
        <strong>Пример.</strong> Метрика «Покупки», расчёт «Сумма за год»,
        условие «Не меньше», порог 20 — карточка появится при 20 или более
        покупках. Подпись «покупок» превратит результат в «24 покупки».
        Изменения применятся при следующей генерации итогов; уже сохранённая
        история не переписывается.
      </aside>
      <p className="mt-4 text-xs leading-5 text-[#8a8d91]">
        Среднее и лучший месяц доступны только для просмотров, избранного,
        покупок и продаж. Backend сохраняет обязательные первый и финальный
        слайды и добавляет не более семи настраиваемых карточек.
      </p>
    </section>
  );
}

function FieldGroup({
  fields,
  title,
}: {
  fields: ReadonlyArray<readonly [string, string]>;
  title: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-black">{title}</h3>
      <dl className="mt-4 space-y-4">
        {fields.map(([name, description]) => (
          <div key={name}>
            <dt className="text-sm font-bold">{name}</dt>
            <dd className="mt-1 text-xs leading-5 text-[#6f7377]">
              {description}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
