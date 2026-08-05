const links = ['Помощь', 'Безопасность', 'Реклама на сайте', 'О компании', 'Карьера', 'Авито Журнал', 'Блог', '#яПомогаю', 'Приложение', 'Регионы']

export function AvitoFooter() {
  return (
    <footer className="avito-static-footer">
      <div>{links.map((link) => <span key={link}>{link}</span>)}</div>
      <p>Авито — сайт объявлений России. © ООО «КЕХ еКоммерц» 2007–2026. Правила Авито · Политика конфиденциальности</p>
    </footer>
  )
}
