import { Camera, MapPin, PackagePlus } from 'lucide-react'

export function AvitoCreateListingPage() {
  return (
    <section className="avito-mock-section avito-mock-create">
      <header className="avito-mock-heading">
        <span>Новое объявление</span>
        <h1>Разместить объявление</h1>
        <p>Шаблон формы публикации на Avito.</p>
      </header>
      <div className="avito-mock-form">
        <label><span>Название</span><input disabled placeholder="Например, велосипед" /></label>
        <label><span>Категория</span><input disabled placeholder="Выберите категорию" /></label>
        <label><span>Цена, ₽</span><input disabled placeholder="0" /></label>
        <label><span>Описание</span><textarea disabled placeholder="Расскажите о товаре" rows={4} /></label>
        <div className="avito-mock-upload"><Camera aria-hidden="true" /><strong>Добавить фотографии</strong><span>До 10 изображений</span></div>
        <div className="avito-mock-location"><MapPin aria-hidden="true" /><span><strong>Краснодар</strong><small>Место публикации</small></span></div>
        <button disabled type="button"><PackagePlus aria-hidden="true" />Разместить объявление</button>
      </div>
    </section>
  )
}
