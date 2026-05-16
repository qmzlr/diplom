import { router } from '@inertiajs/react'
import type { Course } from '@/data/courses'

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="pn-card course-catalog-card">
      <img className="pn-card-media" src={course.img} alt={course.title} />
      <div className="pn-card-body">
        <div className="pn-meta">
          {course.instrument} · {course.level}
        </div>
        <h3 className="pn-title">{course.title}</h3>
        <div className="course-author">Автор: {course.author}</div>
        <p className="pn-text">{course.shortDescription}</p>
        <button className="pn-button" onClick={() => router.visit(`/courses/${course.id}`)}>
          Перейти к курсу →
        </button>
      </div>
    </article>
  )
}
