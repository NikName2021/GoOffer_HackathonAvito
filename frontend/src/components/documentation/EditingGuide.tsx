import { BarChart3, PencilLine, Sparkles } from "lucide-react";

const guides = [
  {
    icon: PencilLine,
    title: "Редактирование профиля",
    text: "Владелец открывает меню карточки и форму редактирования. Фронтенд загружает исходные данные профиля, изменяет имя, фото, просмотры и объявления, затем отправляет полный PUT-запрос. После успеха React Query обновляет список и подробности.",
  },
  {
    icon: Sparkles,
    title: "Добавление и редактирование ачивок",
    text: "Администратору доступна «Настройка итогов года». Там задаются метрика, способ расчёта, условие показа, текст, оформление, порядок и профиль. Создание, изменение и удаление выполняются через защищённый admin API; обычным пользователям раздел недоступен.",
  },
  {
    icon: BarChart3,
    title: "На чём строятся итоги",
    text: "Backend использует массивы просмотренных и собственных объявлений: даты просмотров, избранное, покупки, продажи, цену, категорию, контакты и отзывы. События фильтруются по выбранному UTC-году, агрегируются в метрики, графики, встроенные и администраторские карточки.",
  },
];

export function EditingGuide() {
  return (
    <section id="logic">
      <p className="text-sm font-bold text-[#00b956]">Логика приложения</p>
      <h2 className="mt-1 text-2xl font-black sm:text-3xl">
        Данные, карточки и ачивки
      </h2>
      <div className="mt-6 space-y-4">
        {guides.map((guide) => (
          <article
            className="flex gap-4 rounded-3xl border border-[#e7e9eb] p-5 sm:p-6"
            key={guide.title}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7faef] text-[#00b956]">
              <guide.icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h3 className="font-black">{guide.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f7377]">
                {guide.text}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#f5f5f5] px-5 py-4 text-sm leading-6 text-[#6f7377]">
        Готовые итоги сохраняются в PostgreSQL и кешируются в Redis. Redis не
        является источником истины: при его недоступности приложение продолжает
        работать через PostgreSQL.
      </p>
    </section>
  );
}
