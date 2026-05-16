import { router } from '@inertiajs/react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import type { Instrument } from '@/data/courses'

export default function Instruments({ instruments }: { instruments: Instrument[] }) {
  return (
    <AppShell>
      <PageHero
        eyebrow="Инструменты"
        title="Выберите направление"
        text="Каждый инструмент ведет к подборке курсов, упражнениям и самостоятельной практике."
        image="/images/work-05.jpg"
      />
      <section className="pn-section">
        <div className="pn-container">
          <SectionTitle title="Инструменты" aside="Обучение по направлениям" />
          <div className="pn-grid">
            {instruments.map((instrument) => (
              <article className="pn-card instrument-card" key={instrument.id}>
                <img className="pn-card-media" src={instrument.image} alt={instrument.name} />
                <div className="pn-card-body">
                  <div className="pn-meta">{instrument.courseCount} курс</div>
                  <h3 className="pn-title">{instrument.name}</h3>
                  <p className="pn-text">{instrument.description}</p>
                  <button className="pn-button" onClick={() => router.visit(`/courses?instrument=${encodeURIComponent(instrument.name)}`)}>
                    Перейти к обучению →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
