import { router } from '@inertiajs/react'
import { AppShell, PageHero, ProgressLine, SectionTitle } from '@/components/AppShell'
import { CourseCard } from '@/components/CourseCard'
import type { CommentItem, Course } from '@/data/courses'
import { useAuth } from '@/hooks/useAuth'
import { postJson } from '@/lib/http'
import { useState } from 'react'

export default function CourseDetail({
  canComment,
  comments,
  course,
  relatedCourses,
}: {
  canComment: boolean
  comments: CommentItem[]
  course: Course
  relatedCourses: Course[]
}) {
  const { isAuthenticated } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [message, setMessage] = useState('')
  const [commentItems] = useState(comments)
  const [commentText, setCommentText] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const related = relatedCourses.filter((item) => item.instrument === course.instrument || item.level === course.level).slice(0, 3)
  const fallbackRelated = relatedCourses.slice(0, 3)
  const firstLesson = course.lessonList[0]
  const lessonCountLabel = formatLessonCount(course.lessonList.length)
  const startCourse = async () => {
    if (!isAuthenticated) {
      router.visit('/login')
      return
    }

    setIsStarting(true)
    setMessage('')

    try {
      const response = await postJson<{ lessonUrl: string | null }>(`/api/courses/${course.id}/enroll`)
      router.visit(response.lessonUrl ?? '/profile')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось начать курс.')
      setIsStarting(false)
    }
  }

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isAuthenticated) {
      router.visit('/login')
      return
    }

    setIsCommentSubmitting(true)
    setCommentMessage('')

    try {
      await postJson<{ comment: CommentItem }>('/api/comments', {
        text: commentText,
        targetType: 'course',
        targetCode: course.id,
      })
      setCommentText('')
      setCommentMessage('Комментарий отправлен на модерацию.')
    } catch (error) {
      setCommentMessage(error instanceof Error ? error.message : 'Не удалось отправить комментарий.')
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  return (
    <AppShell>
      <PageHero eyebrow={`${course.instrument} · ${course.level}`} title={course.title} text={course.tagline} image={course.img} />
      <section className="pn-section">
        <div className="pn-container course-detail-grid">
          <div>
            <SectionTitle title="О курсе" />
            {course.description.map((paragraph) => (
              <p className="course-paragraph" key={paragraph}>{paragraph}</p>
            ))}
            <div className="course-meta-grid">
              <Info label="Инструмент" value={course.instrument} />
              <Info label="Уровень" value={course.level} />
              <Info label="Уроки" value={lessonCountLabel} />
            </div>
            <SectionTitle title="Чему научитесь" aside="Результат" />
            <div className="pn-grid">
              {course.outcomes.map((outcome, index) => (
                <article className="pn-card pn-card-body" key={outcome}>
                  <div className="pn-meta">{String(index + 1).padStart(2, '0')}</div>
                  <h3 className="pn-title">{outcome}</h3>
                </article>
              ))}
            </div>
            <div className="course-lessons-heading">
              <SectionTitle title="Уроки курса" aside={lessonCountLabel} />
            </div>
            <div className="lesson-table">
              {course.lessonList.map((lesson, index) => (
                <button key={lesson.id} onClick={() => router.visit(`/courses/${course.id}/lessons/${lesson.id}`)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{lesson.title}</strong>
                  <em>{lesson.duration}</em>
                </button>
              ))}
            </div>
            <section className="course-comments">
              <SectionTitle title="Комментарии курса" aside={`${commentItems.length} записей`} />
              <div className="comments-list">
                {commentItems.map((comment) => (
                  <article key={comment.id} className="pn-card pn-card-body">
                    <div className="pn-meta">{comment.author}</div>
                    <p>{comment.text}</p>
                  </article>
                ))}
                {commentItems.length === 0 && <p className="pn-text">Пока нет одобренных комментариев.</p>}
              </div>
              {canComment ? (
                <form className="comment-form" onSubmit={submitComment}>
                  <textarea
                    className="pn-textarea"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Оставьте комментарий к курсу"
                    required
                  />
                  <button className="pn-button is-dark" disabled={isCommentSubmitting || !commentText.trim()}>
                    {isCommentSubmitting ? 'Отправляем...' : 'Отправить на модерацию'}
                  </button>
                </form>
              ) : (
                <p className="pn-text course-comment-note">Комментарии доступны ученикам, которые записались на курс.</p>
              )}
              {commentMessage && <p className="pn-text">{commentMessage}</p>}
            </section>
          </div>
          <aside className="course-aside">
            <img src={course.img} alt={course.title} />
            <div className="pn-card-body">
              <div className="pn-meta">Прогресс прохождения</div>
              <h3 className="pn-title">{course.progress}%</h3>
              <ProgressLine value={course.progress} />
              <button className="pn-button is-dark" disabled={!firstLesson || isStarting} onClick={startCourse}>
                {!isAuthenticated ? 'Войти, чтобы начать курс' : isStarting ? 'Открываем курс...' : course.progress > 0 ? 'Продолжить обучение' : 'Начать курс'}
              </button>
              {message && <p className="pn-text">{message}</p>}
            </div>
          </aside>
        </div>
      </section>
      <section className="pn-section related-section">
        <div className="pn-container">
          <SectionTitle title="Похожие курсы" aside="Рекомендации" />
          <div className="pn-grid">
            {(related.length ? related : fallbackRelated).map((item) => (
              <CourseCard key={item.id} course={item} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function formatLessonCount(count: number) {
  const remainder = count % 100
  const lastDigit = count % 10

  if (remainder >= 11 && remainder <= 14) {
    return `${count} уроков`
  }

  if (lastDigit === 1) {
    return `${count} урок`
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} урока`
  }

  return `${count} уроков`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="pn-card pn-card-body">
      <div className="pn-meta">{label}</div>
      <h3 className="pn-title">{value}</h3>
    </div>
  )
}
