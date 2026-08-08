import { CheckCheck, MessageCircle } from 'lucide-react'

const chats = [
  { name: 'Марина', text: 'Здравствуйте! Объявление ещё актуально?', time: '12:40' },
  { name: 'Доставка Avito', text: 'Заказ передан в пункт выдачи', time: 'Вчера' },
  { name: 'Александр', text: 'Спасибо, всё отлично подошло!', time: 'Пн' },
]

export function AvitoMessagesPage() {
  return (
    <section className="avito-mock-section">
      <header className="avito-mock-heading">
        <span>Общение</span>
        <h1>Сообщения</h1>
        <p>Диалоги по покупкам, продажам и доставке.</p>
      </header>
      <div className="avito-mock-chats">
        {chats.map((chat, index) => (
          <article key={chat.name}>
            <div className="avito-mock-chat-avatar">{chat.name[0]}</div>
            <div><strong>{chat.name}</strong><p>{chat.text}</p></div>
            <span>{chat.time}{index > 0 && <CheckCheck aria-hidden="true" />}</span>
          </article>
        ))}
      </div>
      <div className="avito-mock-notice"><MessageCircle aria-hidden="true" />Это демонстрационная страница — отправка сообщений отключена.</div>
    </section>
  )
}
