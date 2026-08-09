const team = [
  {
    name: "Мукам Усманов",
    role: "Backend · архитектура",
    details:
      "Доменные модели, Clean Architecture, основная логика генерации итогов и unit-тесты.",
    color: "#00aaff",
  },
  {
    name: "Валентин",
    role: "Backend · данные",
    details:
      "PostgreSQL, миграции, repository-слой, тестовые профили и API активности.",
    color: "#00cc66",
  },
  {
    name: "Дима",
    role: "Backend · инфраструктура",
    details:
      "Recap API, ачивки, рекомендации, интеграционные тесты, Docker, деплой и мониторинг.",
    color: "#965eeb",
  },
  {
    name: "Никита",
    role: "Frontend",
    details:
      "UI/UX, авторизация, CRUD профилей, импорт данных, итоговые stories, графики и интеграция с API.",
    color: "#ff4053",
  },
];

export function ProjectTeam() {
  return (
    <section id="team">
      <p className="text-sm font-bold text-[#00aaff]">Команда</p>
      <h2 className="mt-1 text-2xl font-black sm:text-3xl">
        Кто работал над проектом
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {team.map((member) => (
          <article
            className="relative overflow-hidden rounded-3xl border border-[#e7e9eb] bg-white p-6"
            key={member.name}
          >
            <span
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ backgroundColor: member.color }}
            />
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a8d91]">
              {member.role}
            </p>
            <h3 className="mt-2 text-xl font-black">{member.name}</h3>
            <p className="mt-3 text-sm leading-6 text-[#6f7377]">
              {member.details}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
