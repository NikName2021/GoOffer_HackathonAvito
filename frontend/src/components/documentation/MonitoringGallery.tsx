import { ExternalLink } from "lucide-react";

const dashboards = [
  { file: "grafana-dashboards.png", title: "Список дашбордов" },
  { file: "grafana-go.png", title: "Go backend: логи и память" },
  { file: "grafana-nginx.png", title: "NGINX: соединения и запросы" },
  { file: "grafana-postgres.png", title: "PostgreSQL: ресурсы и активность" },
  { file: "grafana-redis.png", title: "Redis: память, команды и ключи" },
];

export function MonitoringGallery() {
  return (
    <section id="monitoring">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#ff4053]">Наблюдаемость</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            Мониторинг в Grafana
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7377]">
            Дашборды показывают состояние NGINX, Go-приложения, PostgreSQL и
            Redis.
          </p>
        </div>
        <a
          className="inline-flex items-center gap-2 text-sm font-bold text-[#00aaff] hover:underline"
          href="https://statistics-helper.ru/monitoring/"
          rel="noreferrer"
          target="_blank"
        >
          Открыть Grafana <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {dashboards.map((dashboard, index) => (
          <figure
            className={
              index === 0
                ? "overflow-hidden rounded-3xl border border-[#e7e9eb] lg:col-span-2"
                : "overflow-hidden rounded-3xl border border-[#e7e9eb]"
            }
            key={dashboard.file}
          >
            <a
              href={`/documentation/${dashboard.file}`}
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt={dashboard.title}
                className="aspect-video w-full bg-[#181b1f] object-cover object-top transition duration-300 hover:scale-[1.01]"
                loading="lazy"
                src={`/documentation/${dashboard.file}`}
              />
            </a>
            <figcaption className="bg-white px-5 py-4 text-sm font-bold">
              {dashboard.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
