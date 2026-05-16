import { useMemo, useState } from 'react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import { CourseCard } from '@/components/CourseCard'
import type { Course } from '@/data/courses'

const all = 'Все'

export default function CoursesCatalog({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState('')
  const initialInstrument = new URLSearchParams(window.location.search).get('instrument') || all
  const [instrument, setInstrument] = useState(initialInstrument)
  const [level, setLevel] = useState(all)
  const [category, setCategory] = useState(all)
  const [visible, setVisible] = useState(6)

  const instruments = [all, ...Array.from(new Set(courses.map((course) => course.instrument)))]
  const levels = [all, ...Array.from(new Set(courses.map((course) => course.level)))]
  const categories = [all, ...Array.from(new Set(courses.map((course) => course.category)))]

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchesQuery = `${course.title} ${course.author} ${course.instrument} ${course.shortDescription}`.toLowerCase().includes(query.toLowerCase())
      const matchesInstrument = instrument === all || course.instrument === instrument
      const matchesLevel = level === all || course.level === level
      const matchesCategory = category === all || course.category === category

      return matchesQuery && matchesInstrument && matchesLevel && matchesCategory
    })
  }, [category, instrument, level, query, courses])

  const visibleCourses = filtered.slice(0, visible)

  return (
    <AppShell>
      <PageHero
        eyebrow="Каталог обучения"
        title="Курсы"
        text="Выбирайте программу по инструменту, уровню и категории. Каждый курс ведет к урокам, практике и прогрессу."
        image="/images/work-01.jpg"
      />
      <section className="pn-section">
        <div className="pn-container">
          <SectionTitle title="Найти курс" aside={`${filtered.length} программ`} />
          <div className="catalog-controls">
            <label className="catalog-filter">
              <span>Поиск</span>
              <input className="pn-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по курсам" />
            </label>
            <Filter label="Инструмент" value={instrument} onChange={setInstrument} options={instruments} />
            <Filter label="Уровень" value={level} onChange={setLevel} options={levels} />
            <Filter label="Категория" value={category} onChange={setCategory} options={categories} />
          </div>
          <div className={`pn-grid catalog-grid ${visibleCourses.length <= 2 ? 'is-compact' : ''}`}>
            {visibleCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {visibleCourses.length < filtered.length && (
            <button className="pn-button catalog-more" onClick={() => setVisible((value) => value + 3)}>
              Показать ещё
            </button>
          )}
        </div>
      </section>
    </AppShell>
  )
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="catalog-filter">
      <span>{label}</span>
      <select className="pn-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
