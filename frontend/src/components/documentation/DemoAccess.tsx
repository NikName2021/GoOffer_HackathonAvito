import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";

const credentials = [
  { label: "Администратор приложения", login: "nikita", password: "avito2026" },
  { label: "Grafana", login: "admin", password: "admin" },
];

export function DemoAccess() {
  return (
    <section id="access" className="rounded-[28px] bg-[#e8f7ff] p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#00aaff] text-white">
          <KeyRound aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#00aaff]">
            Демонстрационный доступ
          </p>
          <h2 className="mt-1 text-2xl font-black">Учётные данные</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {credentials.map((item) => (
          <article
            className="rounded-3xl bg-white p-5 shadow-sm"
            key={item.label}
          >
            <h3 className="font-bold">{item.label}</h3>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-[#8a8d91]">Логин</dt>
              <dd className="font-mono font-bold">{item.login}</dd>
              <dt className="text-[#8a8d91]">Пароль</dt>
              <dd className="font-mono font-bold">{item.password}</dd>
            </dl>
          </article>
        ))}
      </div>

      <a
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1f1f1f] px-5 py-3 text-sm font-bold text-white transition hover:bg-black"
        href="https://statistics-helper.ru/monitoring/"
        rel="noreferrer"
        target="_blank"
      >
        Открыть аналитику Grafana
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#6f7377]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Данные предназначены только для демонстрационного окружения и не должны
        использоваться в production.
      </p>
    </section>
  );
}
