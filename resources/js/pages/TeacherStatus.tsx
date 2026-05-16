import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import type { Instrument } from '@/data/courses'

export default function TeacherStatus({
  instruments,
  status,
}: {
  instruments: Instrument[]
  status: 'ожидает' | 'одобрен' | 'отклонён'
}) {
  const isRejected = status === 'отклонён'

  return (
    <AppShell>
      <PageHero
        eyebrow="Teacher access"
        title={isRejected ? 'Заявка отклонена' : 'Заявка учителя на проверке'}
        text={isRejected ? 'Свяжитесь с поддержкой, чтобы уточнить детали заявки.' : 'Модератор проверит профиль. После одобрения откроется создание курсов и уроков.'}
        image="/images/work-04.jpg"
      />
      <section className="pn-section teacher-status-page">
        <div className="pn-container teacher-status-card pn-card pn-card-body">
          <SectionTitle title={isRejected ? 'Нужна правка заявки' : 'Ожидает модерации'} aside={status} />
          <p className="pn-text">
            Пока статус не станет “одобрен”, публикация курсов недоступна. Выбранные направления уже сохранены в профиле заявки.
          </p>
          <div className="dashboard-chip-list">
            {instruments.map((instrument) => (
              <span className="dashboard-chip is-selected" key={instrument.id}>{instrument.name}</span>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
