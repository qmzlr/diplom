import { useEffect, useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import type { CommentItem, Course, TeacherApplication, UserVideo } from '@/data/courses'
import { patchJson } from '@/lib/http'
import { toast } from 'sonner'

type QueueItem =
  | { kind: 'video'; id: string; status: UserVideo['status']; title: string; meta: string; text: string; image: string; source: UserVideo }
  | { kind: 'comment'; id: string; status: CommentItem['status']; title: string; meta: string; text: string; source: CommentItem }
  | { kind: 'teacher'; id: string; status: TeacherApplication['status']; title: string; meta: string; text: string; source: TeacherApplication }
  | { kind: 'course'; id: string; status: NonNullable<Course['status']>; title: string; meta: string; text: string; source: Course }

type ModeratorTab = 'Все' | 'Ожидают' | 'Видео' | 'Комментарии' | 'Учителя' | 'Курсы'

const statusLabels = ['Все статусы', 'ожидает', 'на модерации', 'одобрено', 'одобрен', 'опубликовано', 'отклонено', 'отклонён'] as const
const pageSize = 8
const workModes = [
  ['Вся очередь', 'Все материалы в одной рабочей ленте', 'Все'],
  ['Видео', 'Проверка пользовательских видео', 'Видео'],
  ['Комментарии', 'Проверка обсуждений и отзывов', 'Комментарии'],
  ['Учителя', 'Заявки преподавателей на доступ к курсам', 'Учителя'],
  ['Курсы', 'Курсы учителей перед публикацией', 'Курсы'],
] as const

export default function Moderator({
  comments,
  courseSubmissions,
  teacherApplications,
  userVideos,
}: {
  comments: CommentItem[]
  courseSubmissions: Course[]
  teacherApplications: TeacherApplication[]
  userVideos: UserVideo[]
}) {
  const [videos, setVideos] = useState(userVideos)
  const [items, setItems] = useState(comments)
  const [teachers, setTeachers] = useState(teacherApplications)
  const [courses, setCourses] = useState(courseSubmissions)
  const [tab, setTab] = useState<ModeratorTab | null>(null)
  const [status, setStatus] = useState<(typeof statusLabels)[number]>('Все статусы')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const queue = useMemo<QueueItem[]>(() => [
    ...videos.map((video) => ({
      kind: 'video' as const,
      id: video.id,
      status: video.status,
      title: video.title,
      meta: `${video.author} · ${video.instrument}`,
      text: video.description || 'Без описания',
      image: video.image,
      source: video,
    })),
    ...items.map((comment) => ({
      kind: 'comment' as const,
      id: comment.id,
      status: comment.status,
      title: comment.author,
      meta: comment.target,
      text: comment.text,
      source: comment,
    })),
    ...teachers.map((teacher) => ({
      kind: 'teacher' as const,
      id: teacher.id,
      status: teacher.status,
      title: teacher.name || teacher.email || 'Заявка учителя',
      meta: teacher.email || 'email не указан',
      text: teacher.instruments.length ? `Инструменты: ${teacher.instruments.join(', ')}` : 'Инструменты не выбраны',
      source: teacher,
    })),
    ...courses.map((course) => ({
      kind: 'course' as const,
      id: course.id,
      status: course.status ?? 'опубликовано',
      title: course.title,
      meta: `${course.owner?.name || course.author} · ${course.instrument} · ${course.level}`,
      text: course.tagline || course.shortDescription,
      source: course,
    })),
  ].sort((first, second) => priority(second.status) - priority(first.status)), [courses, items, teachers, videos])

  const filtered = queue.filter((item) => {
    const isPending = item.status === 'ожидает' || item.status === 'на модерации'
    const matchesTab =
      tab === null ||
      tab === 'Все' ||
      (tab === 'Ожидают' && isPending) ||
      (tab === 'Видео' && item.kind === 'video') ||
      (tab === 'Комментарии' && item.kind === 'comment') ||
      (tab === 'Учителя' && item.kind === 'teacher') ||
      (tab === 'Курсы' && item.kind === 'course')
    const matchesStatus = status === 'Все статусы' || item.status === status
    const haystack = `${item.title} ${item.meta} ${item.text}`.toLowerCase()
    return matchesTab && matchesStatus && haystack.includes(query.toLowerCase())
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [tab, status, query])

  const stats = {
    pending: queue.filter((item) => item.status === 'ожидает' || item.status === 'на модерации').length,
    approved: queue.filter((item) => item.status === 'одобрено' || item.status === 'опубликовано' || item.status === 'одобрен').length,
    rejected: queue.filter((item) => item.status === 'отклонено' || item.status === 'отклонён').length,
  }

  const updateItem = async (item: QueueItem, nextStatus: QueueItem['status']) => {
    try {
      if (item.kind === 'video') {
        const payload = await patchJson<{ video: UserVideo }>(`/api/videos/${numericId(item.id)}/status`, { status: nextStatus })
        setVideos((current) => current.map((video) => video.id === item.id ? payload.video : video))
        toast.success('Статус видео обновлён.')
        return
      }

      if (item.kind === 'comment') {
        const payload = await patchJson<{ comment: CommentItem }>(`/api/comments/${numericId(item.id)}/status`, { status: nextStatus })
        setItems((current) => current.map((comment) => comment.id === item.id ? payload.comment : comment))
        toast.success('Статус комментария обновлён.')
        return
      }

      if (item.kind === 'teacher') {
        const payload = await patchJson<{ teacher: TeacherApplication }>(`/api/teachers/${numericId(item.id)}/status`, { status: nextStatus })
        setTeachers((current) => current.map((teacher) => teacher.id === item.id ? payload.teacher : teacher))
        toast.success('Статус учителя обновлён.')
        return
      }

      const payload = await patchJson<{ course: Course }>(`/api/courses/${item.id}/status`, { status: nextStatus })
      setCourses((current) => current.map((course) => course.id === item.id ? payload.course : course))
      toast.success('Статус курса обновлён.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось выполнить действие.')
    }
  }

  return (
    <AppShell>
      <PageHero eyebrow="Проверка контента" title="Панель модератора" text="Единая очередь видео и комментариев с быстрыми решениями по статусам." image="/images/work-06.jpg" />
      <section className="pn-section moderator-page">
        <div className="pn-container">
          <SectionTitle title="Очередь модерации" aside={`${filtered.length} материалов`} />
          <div className="moderator-summary">
            <Stat label="Ожидают" value={stats.pending} />
            <Stat label="Одобрено" value={stats.approved} />
            <Stat label="Отклонено" value={stats.rejected} />
          </div>
          {!tab ? (
            <div className="admin-choice-grid moderator-choice-grid">
              {workModes.map(([title, text, nextTab]) => (
                <button className="pn-card pn-card-body admin-choice-card" key={title} onClick={() => setTab(nextTab)}>
                  <div className="pn-meta">Рабочий режим</div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="moderator-toolbar">
                <button className="pn-button" onClick={() => { setTab(null); setQuery(''); setStatus('Все статусы') }}>Назад к выбору</button>
                <input className="pn-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по автору, названию или тексту" />
                <select className="pn-select" value={status} onChange={(event) => setStatus(event.target.value as (typeof statusLabels)[number])}>
                  {statusLabels.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="moderation-queue">
                {visibleItems.map((item) => (
                  <article className={`pn-card pn-card-body moderation-item ${item.kind !== 'video' ? 'is-comment' : ''}`} key={`${item.kind}-${item.id}`}>
                    {item.kind === 'video' && (
                      <div className="moderation-preview">
                        <img src={item.image} alt={item.title} />
                      </div>
                    )}
                    <div>
                      <div className="pn-meta">{kindLabel(item.kind)} · {item.status}</div>
                      <h3 className="pn-title">{item.title}</h3>
                      <p className="pn-text">{item.meta}</p>
                      <p className={item.kind === 'comment' ? 'moderation-comment-text' : undefined}>{item.text}</p>
                      <div className="moderation-actions">
                        <button className="pn-button is-dark" onClick={() => updateItem(item, approvedStatus(item))}>Одобрить</button>
                        <button className="pn-button" onClick={() => updateItem(item, rejectedStatus(item))}>Отклонить</button>
                        <button className="pn-button" onClick={() => updateItem(item, queuedStatus(item))}>Вернуть в очередь</button>
                        {item.kind !== 'teacher' && <button className="pn-button" onClick={() => openItem(item)}>Открыть</button>}
                      </div>
                    </div>
                  </article>
                ))}
                {filtered.length === 0 && <p className="pn-text">Материалов по выбранным фильтрам нет.</p>}
              </div>
              <QueuePagination page={currentPage} pageCount={pageCount} onPage={setPage} />
            </>
          )}
        </div>
      </section>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="pn-card pn-card-body admin-stat-card">
      <div className="pn-meta">{label}</div>
      <strong>{value}</strong>
      <span>материалов</span>
    </article>
  )
}

function numericId(id: string) {
  return id.replace(/^\D+/, '')
}

function priority(status: string) {
  if (status === 'ожидает' || status === 'на модерации') return 3
  if (status === 'отклонено' || status === 'отклонён') return 2
  return 1
}

function openItem(item: QueueItem) {
  if (item.kind === 'video') {
    router.visit(item.source.detailUrl ?? '/community')
    return
  }

  if (item.kind === 'course') {
    router.visit(`/courses/${item.id}`)
    return
  }

  if (item.kind === 'teacher') {
    return
  }

  const comment = item.source
  if (comment.targetUrl) {
    router.visit(comment.targetUrl)
    return
  }

  router.visit('/courses')
}

function kindLabel(kind: QueueItem['kind']) {
  if (kind === 'video') return 'Видео'
  if (kind === 'comment') return 'Комментарий'
  if (kind === 'teacher') return 'Учитель'
  return 'Курс'
}

function approvedStatus(item: QueueItem): QueueItem['status'] {
  if (item.kind === 'video' || item.kind === 'course') return 'опубликовано'
  if (item.kind === 'teacher') return 'одобрен'
  return 'одобрено'
}

function rejectedStatus(item: QueueItem): QueueItem['status'] {
  return item.kind === 'teacher' ? 'отклонён' : 'отклонено'
}

function queuedStatus(item: QueueItem): QueueItem['status'] {
  if (item.kind === 'video' || item.kind === 'course') return 'на модерации'
  return 'ожидает'
}

function QueuePagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <div className="table-pagination">
      <button className="pn-button" disabled={page === 1} onClick={() => onPage(Math.max(1, page - 1))}>Назад</button>
      <div className="pagination-pages">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button
            className={`pagination-page ${pageNumber === page ? 'is-active' : ''}`}
            key={pageNumber}
            type="button"
            onClick={() => onPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button className="pn-button" disabled={page === pageCount} onClick={() => onPage(Math.min(pageCount, page + 1))}>Далее</button>
    </div>
  )
}
