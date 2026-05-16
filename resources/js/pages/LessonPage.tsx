import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell, ProgressLine, SectionTitle } from '@/components/AppShell'
import type { CommentItem, Course } from '@/data/courses'
import { useAuth } from '@/hooks/useAuth'
import { patchJson, postJson } from '@/lib/http'

export default function LessonPage({
  course,
  lessonId,
  comments,
  canComment,
}: {
  course: Course
  lessonId: string
  comments: CommentItem[]
  canComment: boolean
}) {
  const { isAuthenticated } = useAuth()
  const [courseState, setCourseState] = useState(course)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [canLeaveComment, setCanLeaveComment] = useState(canComment)
  const [commentItems] = useState(comments)
  const [commentText, setCommentText] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const currentIndex = Math.max(0, courseState.lessonList.findIndex((lesson) => lesson.id === lessonId))
  const lesson = courseState.lessonList[currentIndex] ?? courseState.lessonList[0]
  const progress = useMemo(() => {
    if (courseState.lessonList.length === 0) return 0
    const done = courseState.lessonList.filter((item) => item.completed).length
    return Math.round((done / courseState.lessonList.length) * 100)
  }, [courseState.lessonList])

  const prev = courseState.lessonList[currentIndex - 1]
  const next = courseState.lessonList[currentIndex + 1]

  const markCompleted = async () => {
    if (!lesson) return

    if (!isAuthenticated) {
      router.visit('/login')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      const response = await patchJson<{ course: Course }>(`/api/lessons/${lesson.databaseId}/progress`, {
        completed: true,
      })
      setCourseState(response.course)
      setCanLeaveComment(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить прогресс.')
    } finally {
      setIsSaving(false)
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
        targetType: 'lesson',
        targetCode: lesson.id,
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
      <section className="lesson-layout pn-container">
        <div>
          <div className="lesson-player-shell">
            <video className="lesson-player" src={lesson.video} poster={courseState.img} controls />
            <div className="lesson-player-caption">
              <span className="pn-meta">Видео урока</span>
              <strong>{lesson.title}</strong>
            </div>
          </div>
          <div className="lesson-actions">
            <button className="pn-button" disabled={!prev} onClick={() => prev && router.visit(`/courses/${courseState.id}/lessons/${prev.id}`)}>
              ← Предыдущий
            </button>
            <button className="pn-button is-dark" disabled={isSaving || lesson?.completed} onClick={markCompleted}>
              {lesson?.completed ? 'Урок завершён' : isSaving ? 'Сохраняем...' : 'Отметить как завершённый'}
            </button>
            <button className="pn-button" disabled={!next} onClick={() => next && router.visit(`/courses/${courseState.id}/lessons/${next.id}`)}>
              Следующий →
            </button>
          </div>
          {message && <p className="pn-text">{message}</p>}
          <SectionTitle title={lesson.title} aside={courseState.title} />
          <p className="pn-text">{lesson.description}</p>
          <div className="comments-list">
            <h3>Комментарии</h3>
            {commentItems.map((comment) => (
              <article key={comment.id} className="pn-card pn-card-body">
                <div className="pn-meta">{comment.author} · {comment.target}</div>
                <p>{comment.text}</p>
              </article>
            ))}
            {commentItems.length === 0 && <p className="pn-text">Пока нет одобренных комментариев.</p>}
            {canLeaveComment ? (
              <form className="comment-form" onSubmit={submitComment}>
                <textarea
                  className="pn-textarea"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Оставьте комментарий к уроку"
                  required
                />
                <button className="pn-button is-dark" disabled={isCommentSubmitting || !commentText.trim()}>
                  {isCommentSubmitting ? 'Отправляем...' : 'Отправить на модерацию'}
                </button>
              </form>
            ) : (
              <p className="pn-text">Комментарий можно оставить после завершения урока.</p>
            )}
            {commentMessage && <p className="pn-text">{commentMessage}</p>}
          </div>
        </div>
        <aside className="lesson-sidebar">
          <div className="pn-card pn-card-body">
            <div className="pn-meta">Прогресс курса</div>
            <h3 className="pn-title">{progress}%</h3>
            <ProgressLine value={progress} />
          </div>
          <div className="pn-card pn-card-body">
            <div className="pn-meta">Все уроки</div>
            {courseState.lessonList.map((item, index) => (
              <button
                key={item.id}
                className={`lesson-list-item ${item.id === lesson.id ? 'is-active' : ''}`}
                onClick={() => router.visit(`/courses/${courseState.id}/lessons/${item.id}`)}
              >
                {String(index + 1).padStart(2, '0')} · {item.title}
              </button>
            ))}
          </div>
          <div className="pn-card pn-card-body">
            <div className="pn-meta">Быстрый доступ</div>
            <h3 className="pn-title">Метроном</h3>
            <p className="pn-text">Откройте метроном и держите ровный темп во время практики.</p>
            <button className="pn-button lesson-sidebar-action" onClick={() => router.visit('/metronome')}>Открыть метроном</button>
          </div>
        </aside>
      </section>
    </AppShell>
  )
}
