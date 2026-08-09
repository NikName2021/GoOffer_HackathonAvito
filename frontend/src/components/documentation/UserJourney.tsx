import { Box, CircleUserRound, Flag, Gift, Import, Store } from "lucide-react";

const steps = [
  {
    icon: CircleUserRound,
    title: "Войти",
    text: "Авторизоваться или создать аккаунт.",
  },
  {
    icon: Import,
    title: "Добавить профиль",
    text: "Заполнить форму вручную или импортировать JSON.",
  },
  {
    icon: Box,
    title: "Выбрать профиль",
    text: "Посмотреть сводку, отредактировать данные или удалить профиль.",
  },
  {
    icon: Store,
    title: "Открыть Авито",
    text: "Перейти в статичную симуляцию главной страницы.",
  },
  {
    icon: Gift,
    title: "Распаковать итоги",
    text: "Открыть подарок и листать персональные карточки и графики.",
  },
  {
    icon: Flag,
    title: "Выбрать миссию",
    text: "Сохранить цель на следующий год на финальном слайде.",
  },
];

export function UserJourney() {
  return (
    <section id="journey">
      <p className="text-sm font-bold text-[#965eeb]">Пользовательский путь</p>
      <h2 className="mt-1 text-2xl font-black sm:text-3xl">
        От профиля до итогов года
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <article className="rounded-3xl bg-[#f6f3ff] p-5" key={step.title}>
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-white text-[#965eeb] shadow-sm">
                <step.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="text-sm font-black text-[#b7a3e8]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-5 font-black">{step.title}</h3>
            <p className="mt-2 text-sm leading-5 text-[#6f7377]">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
