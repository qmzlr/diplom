import { router } from '@inertiajs/react'
import { useState } from 'react'
import { AppShell, PageHero, ProgressLine, SectionTitle } from '@/components/AppShell'
import { MediaAttachmentPreview } from '@/components/MediaAttachmentPreview'
import { initialUploadProgress, UploadProgress } from '@/components/UploadProgress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CompletedLesson, Course, Instrument, UserVideo } from '@/data/courses'
import { useAuth } from '@/hooks/useAuth'
import { deleteJson, patchJson, uploadFormData, type UploadProgressState } from '@/lib/http'

const profileCoursePageSize = 4

export default function Dashboard({
  completedLessons,
  courses,
  instruments,
  recommendations,
  selectedInstruments,
  userVideos,
}: {
  completedLessons: CompletedLesson[]
  courses: Course[]
  instruments: Instrument[]
  recommendations: Course[]
  selectedInstruments: Instrument[]
  userVideos: UserVideo[]
}) {
  const { user, refresh, logout } = useAuth({ redirectPath: '/' })
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [level, setLevel] = useState(user?.level ?? 'Начинающий')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [selectedIds, setSelectedIds] = useState(() => new Set(selectedInstruments.map((item) => item.id)))
  const [profileInstruments, setProfileInstruments] = useState(selectedInstruments)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [avatarProgress, setAvatarProgress] = useState<UploadProgressState | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isLessonsDialogOpen, setIsLessonsDialogOpen] = useState(false)
  const [coursePage, setCoursePage] = useState(1)
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)

  const currentCourses = courses
  const coursePageCount = Math.max(1, Math.ceil(currentCourses.length / profileCoursePageSize))
  const visibleCoursePage = Math.min(coursePage, coursePageCount)
  const visibleCourses = currentCourses.slice(
    (visibleCoursePage - 1) * profileCoursePageSize,
    visibleCoursePage * profileCoursePageSize,
  )
  const visibleCompletedLessons = completedLessons.slice(0, 5)
  const averageProgress = Math.round(
    currentCourses.length > 0 ? currentCourses.reduce((sum, course) => sum + course.progress, 0) / currentCourses.length : 0
  )
  const primaryInstrument = profileInstruments[0]?.name || user?.instrument || 'не выбран'

  const toggleInstrument = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsAvatarUploading(true)
    setAvatarProgress(initialUploadProgress())
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await uploadFormData<{ avatar: string }>('/api/profile/avatar', formData, setAvatarProgress)
      setAvatar(response.avatar)
      setMessage('Фото профиля обновлено.')
      refresh()
    } catch (error) {
      setAvatarProgress((current) => current ? { ...current, status: 'error' } : null)
      setMessage(error instanceof Error ? error.message : 'Не удалось загрузить фото.')
    } finally {
      setIsAvatarUploading(false)
      event.target.value = ''
    }
  }

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const response = await patchJson<{ instruments: Instrument[] }>('/api/profile', {
        name,
        email,
        level,
        avatar,
        instrumentIds: Array.from(selectedIds),
      })
      setProfileInstruments(response.instruments)
      setMessage('Профиль обновлён.')
      refresh()
      router.reload({ only: ['recommendations', 'selectedInstruments'] })
      setIsProfileDialogOpen(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось обновить профиль.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProfile = async () => {
    if (!window.confirm('Удалить профиль? Это действие нельзя отменить.')) {
      return
    }

    setIsDeletingProfile(true)
    setMessage('')

    try {
      await deleteJson<{ success: boolean }>('/api/profile')
      router.visit('/')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось удалить профиль.')
      setIsDeletingProfile(false)
    }
  }

  return (
    <AppShell>
      <PageHero
        eyebrow="Личный профиль"
        title={`Привет, ${user?.name || 'музыкант'}`}
        text="Профиль, активные курсы, прогресс, рекомендации и быстрые действия в одном рабочем пространстве."
        image="/images/work-02.jpg"
      />
      <section className="pn-section dashboard-page">
        <div className="pn-container dashboard-layout">
          <aside className="pn-card dashboard-profile-card">
            <img src={avatar || user?.avatar || '/images/course-vocal.jpg'} alt="Аватар пользователя" />
            <div className="pn-meta">{email || user?.email || 'student@playnote.local'}</div>
            <h2>{name || user?.name || 'PlayNote Student'}</h2>
            <p className="pn-text">Основной инструмент: {primaryInstrument} · уровень: {level || user?.level || 'не выбран'}</p>
            <div className="dashboard-profile-stats">
              <span>
                <strong>{averageProgress}%</strong>
                Средний прогресс
              </span>
              <span>
                <strong>{currentCourses.length}</strong>
                Активных курса
              </span>
              <span>
                <strong>{userVideos.length}</strong>
                Видео в профиле
              </span>
            </div>
            <div className="dashboard-actions">
              <button className="pn-button is-dark" onClick={() => router.visit('/courses')}>
                Продолжить обучение
              </button>
              <button
                className="pn-button"
                onClick={() => {
                  setMessage('')
                  setIsProfileDialogOpen(true)
                }}
              >
                Редактировать профиль
              </button>
              <button className="pn-button" onClick={() => router.visit('/community')}>
                Сообщество
              </button>
              <button className="pn-button" onClick={() => router.visit('/metronome')}>
                Метроном
              </button>
              <button className="pn-button" onClick={logout}>
                Выйти
              </button>
              <button className="pn-button is-danger" onClick={deleteProfile} disabled={isDeletingProfile}>
                {isDeletingProfile ? 'Удаляем...' : 'Удалить профиль'}
              </button>
            </div>
          </aside>

          <div className="dashboard-main">
            <div className="dashboard-summary-grid">
              <SummaryCard label="Прогресс" value={`${averageProgress}%`} text="Средний прогресс по активным курсам." />
              <SummaryCard label="Завершено уроков" value={String(completedLessons.length)} text="Уроки, которые отмечены как завершённые." />
              <SummaryCard label="Рекомендации" value={String(recommendations.length)} text="Курсы по вашим инструментам и уровню." />
            </div>

            <section className="dashboard-section">
              <SectionTitle title="Текущие курсы" />
              <div className="dashboard-course-list">
                {currentCourses.length > 0 ? visibleCourses.map((course) => (
                  <button className="dashboard-course-row" key={course.id} onClick={() => router.visit(`/courses/${course.id}`)}>
                    <img src={course.img} alt={course.title} />
                    <span>
                      <em>{course.instrument} · {course.level}</em>
                      <strong>{course.title}</strong>
                      <ProgressLine value={course.progress} />
                    </span>
                  </button>
                )) : (
                  <article className="pn-card pn-card-body dashboard-empty-course">
                    <div className="pn-meta">Пока пусто</div>
                    <h3 className="pn-title">Начните первый курс</h3>
                    <p className="pn-text">После нажатия “Начать курс” программа появится здесь с нулевым прогрессом.</p>
                    <button className="pn-button is-dark" onClick={() => router.visit('/courses')}>Выбрать курс</button>
                  </article>
                )}
              </div>
              {currentCourses.length > profileCoursePageSize && (
                <Pagination page={visibleCoursePage} pageCount={coursePageCount} onPage={setCoursePage} />
              )}
            </section>

            <div className="dashboard-lower-grid">
              <Panel title="Просмотренные уроки">
                {visibleCompletedLessons.length > 0 ? visibleCompletedLessons.map((lesson) => (
                  <button className="dashboard-row dashboard-lesson-row" key={lesson.id} onClick={() => lesson.courseId && lesson.lessonId && router.visit(`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`)}>
                    <span>{lesson.title}</span>
                    <em>{lesson.courseTitle}</em>
                  </button>
                )) : <p className="pn-text">Завершённые уроки появятся здесь.</p>}
                {completedLessons.length > visibleCompletedLessons.length && (
                  <button className="pn-button dashboard-panel-action" onClick={() => setIsLessonsDialogOpen(true)}>
                    Показать все
                  </button>
                )}
              </Panel>

              <Panel title="Рекомендации">
                {recommendations.length > 0 ? recommendations.map((course) => (
                  <button className="dashboard-row dashboard-recommendation-row" key={course.id} onClick={() => router.visit(`/courses/${course.id}`)}>
                    <strong>{course.title}</strong>
                    <em>{course.reason ?? 'подходит профилю'}</em>
                  </button>
                )) : <p className="pn-text">{profileInstruments.length > 0 ? 'Пока нет рекомендаций.' : 'Выберите инструменты в профиле, чтобы получить рекомендации.'}</p>}
              </Panel>

              <Panel title="Видео сообщества">
                {userVideos.slice(0, 2).map((video) => (
                  <div className="dashboard-row" key={video.id}>{video.title} · {video.status}</div>
                ))}
                {userVideos.length === 0 && <p className="pn-text">Ваши видео появятся после загрузки.</p>}
              </Panel>
            </div>
          </div>
        </div>
      </section>
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="profile-dialog">
          <DialogHeader>
            <DialogTitle>Данные профиля</DialogTitle>
            <DialogDescription>Обновите имя, контактные данные, уровень и выбранные инструменты.</DialogDescription>
          </DialogHeader>
          <form className="profile-form" onSubmit={saveProfile}>
            <FieldLabel label="Имя"><input className="pn-input" value={name} onChange={(event) => setName(event.target.value)} required /></FieldLabel>
            <FieldLabel label="Email"><input className="pn-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></FieldLabel>
            <FieldLabel label="Фото профиля">
              <label className="profile-file-control">
                <span>{isAvatarUploading ? 'Загружаем фото...' : avatar ? 'Фото прикреплено' : 'Прикрепить фото профиля'}</span>
                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={isAvatarUploading} />
              </label>
              <MediaAttachmentPreview value={avatar} kind="image" emptyText="Фото профиля пока не выбрано." />
              <UploadProgress progress={avatarProgress} />
            </FieldLabel>
            <FieldLabel label="Уровень">
              <select className="pn-select" value={level} onChange={(event) => setLevel(event.target.value)}>
                <option>Начинающий</option>
                <option>Базовый</option>
                <option>Средний</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Интересующие инструменты">
              <div className="dashboard-chip-list profile-instrument-picker">
                {instruments.map((instrument) => (
                  <label className={`dashboard-chip ${selectedIds.has(instrument.id) ? 'is-selected' : ''}`} key={instrument.id}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(instrument.id)}
                      onChange={() => toggleInstrument(instrument.id)}
                    />
                    {instrument.name}
                  </label>
                ))}
              </div>
            </FieldLabel>
            <button className="pn-button is-dark" disabled={isSaving}>{isSaving ? 'Сохраняем...' : 'Сохранить профиль'}</button>
            {message && <p className="pn-text">{message}</p>}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isLessonsDialogOpen} onOpenChange={setIsLessonsDialogOpen}>
        <DialogContent className="profile-dialog dashboard-lessons-dialog">
          <DialogHeader>
            <DialogTitle>Просмотренные уроки</DialogTitle>
            <DialogDescription>Все уроки, которые вы отметили как завершённые.</DialogDescription>
          </DialogHeader>
          <div className="dashboard-dialog-list">
            {completedLessons.map((lesson) => (
              <button className="dashboard-row dashboard-lesson-row" key={lesson.id} onClick={() => lesson.courseId && lesson.lessonId && router.visit(`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`)}>
                <span>{lesson.title}</span>
                <em>{lesson.courseTitle}</em>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function SummaryCard({ label, value, text }: { label: string; value: string; text: string }) {
  return (
    <article className="pn-card pn-card-body dashboard-summary-card">
      <div className="pn-meta">{label}</div>
      <strong>{value}</strong>
      <p className="pn-text">{text}</p>
    </article>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="pn-card pn-card-body dashboard-panel">
      <div className="pn-meta">{title}</div>
      {children}
    </article>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  return (
    <div className="table-pagination dashboard-course-pagination">
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
