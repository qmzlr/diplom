import { router } from '@inertiajs/react'
import { useState } from 'react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import { MediaAttachmentPreview } from '@/components/MediaAttachmentPreview'
import { initialUploadProgress, UploadProgress } from '@/components/UploadProgress'
import type { Course, Instrument, Lesson } from '@/data/courses'
import { postJson, putJson, uploadFormData, type UploadProgressState } from '@/lib/http'
import { toast } from 'sonner'

const emptyCourse: Course = {
  id: '',
  title: '',
  author: '',
  category: 'Основы',
  instrument: '',
  img: '/images/course-theory.jpg',
  tagline: '',
  shortDescription: '',
  description: [''],
  features: [''],
  outcomes: [''],
  lessons: '1 урок',
  lessonCount: 1,
  level: 'Начинающий',
  progress: 0,
  video: '/videos/spatial.mp4',
  lessonList: [],
}

type Workspace = 'admin' | 'teacher'
const categories = ['Основы', 'Ритм', 'Техника', 'Песни', 'Теория']

export default function CourseEditor({ course, instruments, workspace = 'admin' }: { course?: Course | null; instruments: Instrument[]; workspace?: Workspace }) {
  const baseCourse = course ?? { ...emptyCourse, instrument: instruments[0]?.name ?? '' }
  const [form, setForm] = useState(baseCourse)
  const [lessons, setLessons] = useState<Lesson[]>(baseCourse.lessonList.length > 0 ? baseCourse.lessonList : [newLesson()])
  const [selectedLessonId, setSelectedLessonId] = useState(() => (baseCourse.lessonList[0] ?? newLesson()).id)
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgressState | null>>({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(course)
  const basePath = workspace === 'teacher' ? '/teacher/courses' : '/admin/courses'
  const backUrl = workspace === 'teacher' ? '/teacher?section=courses' : '/admin?section=courses'
  const submitLabel = workspace === 'teacher' ? 'Отправить на модерацию' : 'Сохранить курс'

  const update = (field: keyof Course, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateLines = (field: 'description' | 'features' | 'outcomes', value: string) => {
    setForm((current) => ({ ...current, [field]: value.split('\n') }))
  }

  const updateLesson = (id: string, field: keyof Lesson, value: string) => {
    setLessons((items) => items.map((lesson) => lesson.id === id ? { ...lesson, [field]: value } : lesson))
  }

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0]

  const setSlotProgress = (slot: string, progress: UploadProgressState | null) => {
    setUploadProgress((current) => ({ ...current, [slot]: progress }))
  }

  const uploadMedia = async (file: File | null, type: 'image' | 'video', slot: string) => {
    if (!file) return null
    const data = new FormData()
    data.append('file', file)
    data.append('type', type)
    setSlotProgress(slot, initialUploadProgress())

    try {
      const response = await uploadFormData<{ path: string }>('/api/admin/uploads', data, (progress) => setSlotProgress(slot, progress))
      return response.path
    } catch (error) {
      setSlotProgress(slot, uploadProgress[slot] ? { ...uploadProgress[slot]!, status: 'error' } : null)
      setMessage(error instanceof Error ? error.message : 'Не удалось загрузить файл.')
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить файл.')
      return null
    }
  }

  const attachCourseMedia = async (file: File | null, field: 'img' | 'video') => {
    const path = await uploadMedia(file, field === 'img' ? 'image' : 'video', field === 'img' ? 'course-image' : 'course-video')
    if (path) {
      update(field, path)
      toast.success(field === 'img' ? 'Обложка прикреплена.' : 'Видео-превью прикреплено.')
    }
  }

  const attachLessonVideo = async (lesson: Lesson, file: File | null) => {
    if (!file) return
    const duration = await readVideoDuration(file)
    const path = await uploadMedia(file, 'video', `lesson-${lesson.id}`)
    if (!path) return
    setLessons((items) => items.map((item) => item.id === lesson.id ? {
      ...item,
      video: path,
      duration: duration ?? item.duration,
    } : item))
    toast.success('Видео урока прикреплено.')
  }

  const removeSelectedLesson = () => {
    if (!selectedLesson) return
    if (lessons.length <= 1) {
      toast.error('Нельзя удалить последний урок курса.')
      return
    }

    const currentIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id)
    const nextLessons = lessons.filter((lesson) => lesson.id !== selectedLesson.id)
    const nextLesson = nextLessons[Math.max(0, currentIndex - 1)] ?? nextLessons[0]

    setLessons(nextLessons)
    setSelectedLessonId(nextLesson.id)
    toast.success('Урок удалён.')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage('')

    const payload = {
      ...form,
      id: form.id.trim(),
      description: lines(form.description),
      features: lines(form.features),
      outcomes: lines(form.outcomes),
      lessonCount: lessons.length,
      lessons: `${lessons.length} ${lessons.length === 1 ? 'урок' : 'уроков'}`,
      lessonList: lessons.map((lesson, index) => ({
        ...lesson,
        id: lessonCode(form.id, index),
      })),
    }

    try {
      const response = isEditing
        ? await putJson<{ course: Course }>(`/api/courses/${course!.id}`, payload)
        : await postJson<{ course: Course }>('/api/courses', payload)

      setForm(response.course)
      setLessons(response.course.lessonList)
      setMessage('Курс сохранён.')
      toast.success('Курс сохранён.')

      if (!isEditing) {
        router.visit(`${basePath}/${response.course.id}/edit`)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить курс.')
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить курс.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <PageHero
        eyebrow={workspace === 'teacher' ? 'Teacher course' : 'Course editor'}
        title={isEditing ? 'Редактирование курса' : 'Создание курса'}
        text={workspace === 'teacher' ? 'После сохранения курс отправится модератору перед публикацией.' : 'Форма курса, обложка, уровень, инструмент и уроки внутри программы.'}
        image="/images/course-theory.jpg"
      />
      <section className="pn-section">
        <form className="pn-container editor-form" onSubmit={save}>
          <div className="editor-topbar">
            <button type="button" className="pn-button" onClick={() => router.visit(backUrl)}>Назад</button>
          </div>
          <SectionTitle title="Данные курса" aside="Форма" />
          {isEditing ? (
            <div className="readonly-field">
              <span>Код курса для ссылки</span>
              <strong>{form.id}</strong>
              <em>Используется в адресе курса. Например: /courses/{form.id || '01'}</em>
            </div>
          ) : (
            <FieldLabel label="Код курса для ссылки">
              <input className="pn-input" value={form.id} onChange={(e) => update('id', e.target.value)} required />
              <em>Используется в адресе курса. Например: /courses/{form.id || '01'}</em>
            </FieldLabel>
          )}
          <FieldLabel label="Название"><input className="pn-input" value={form.title} onChange={(e) => update('title', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Автор"><input className="pn-input" value={form.author} onChange={(e) => update('author', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Категория">
            <select className="pn-select" value={form.category} onChange={(e) => update('category', e.target.value)} required>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="Подзаголовок"><input className="pn-input" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Короткое описание"><textarea className="pn-textarea" value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Описание курса"><textarea className="pn-textarea" value={form.description.join('\n')} onChange={(e) => updateLines('description', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Особенности"><textarea className="pn-textarea" value={form.features.join('\n')} onChange={(e) => updateLines('features', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Результаты обучения"><textarea className="pn-textarea" value={form.outcomes.join('\n')} onChange={(e) => updateLines('outcomes', e.target.value)} required /></FieldLabel>
          <FieldLabel label="Инструмент">
            <select className="pn-select" value={form.instrument} onChange={(e) => update('instrument', e.target.value)} required>
              {instruments.map((item) => <option key={item.id}>{item.name}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="Уровень">
            <select className="pn-select" value={form.level} onChange={(e) => update('level', e.target.value)}>
              <option>Начинающий</option>
              <option>Базовый</option>
              <option>Средний</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Обложка курса">
            <FileControl id="course-image-file" label={form.img ? 'Обложка прикреплена' : 'Прикрепить обложку'} accept="image/*" onChange={(file) => attachCourseMedia(file, 'img')} />
            <MediaAttachmentPreview value={form.img} kind="image" emptyText="Обложка пока не выбрана." />
            <UploadProgress progress={uploadProgress['course-image'] ?? null} />
          </FieldLabel>
          <FieldLabel label="Видео-превью курса">
            <FileControl id="course-video-file" label={form.video ? 'Видео прикреплено' : 'Прикрепить видео'} accept="video/*" onChange={(file) => attachCourseMedia(file, 'video')} />
            <MediaAttachmentPreview value={form.video} kind="video" emptyText="Видео пока не выбрано." />
            <UploadProgress progress={uploadProgress['course-video'] ?? null} />
          </FieldLabel>

          <SectionTitle title="Уроки" aside={`${lessons.length} блока`} />
          <div className="lesson-picker">
            {lessons.map((lesson, index) => (
              <button
                className={`lesson-picker-item ${lesson.id === selectedLesson?.id ? 'is-active' : ''}`}
                key={lesson.id}
                type="button"
                onClick={() => setSelectedLessonId(lesson.id)}
              >
                <span>Урок {String(index + 1).padStart(2, '0')}</span>
                <strong>{lesson.title || 'Новый урок'}</strong>
              </button>
            ))}
            <button type="button" className="pn-button" onClick={() => {
              const lesson = newLesson()
              setLessons((items) => [...items, lesson])
              setSelectedLessonId(lesson.id)
            }}>Добавить урок</button>
          </div>
          {selectedLesson && (
            <article className="pn-card pn-card-body lesson-editor" key={selectedLesson.id}>
              <div className="pn-meta">Редактируется урок {String(lessons.findIndex((lesson) => lesson.id === selectedLesson.id) + 1).padStart(2, '0')}</div>
              <FieldLabel label="Название урока"><input className="pn-input" value={selectedLesson.title} onChange={(e) => updateLesson(selectedLesson.id, 'title', e.target.value)} required /></FieldLabel>
              <FieldLabel label="Описание урока"><textarea className="pn-textarea" value={selectedLesson.description} onChange={(e) => updateLesson(selectedLesson.id, 'description', e.target.value)} required /></FieldLabel>
              <FieldLabel label="Видео урока">
                <FileControl id={`lesson-video-${selectedLesson.id}`} label={selectedLesson.video ? 'Видео прикреплено' : 'Прикрепить видео'} accept="video/*" onChange={(file) => attachLessonVideo(selectedLesson, file)} />
                <MediaAttachmentPreview value={selectedLesson.video} kind="video" emptyText="Видео урока пока не выбрано." />
                <UploadProgress progress={uploadProgress[`lesson-${selectedLesson.id}`] ?? null} />
              </FieldLabel>
              <FieldLabel label="Длительность">
                <input className="pn-input" value={selectedLesson.duration} onChange={(e) => updateLesson(selectedLesson.id, 'duration', e.target.value)} readOnly={Boolean(selectedLesson.video)} required />
                <em>{selectedLesson.video ? 'Определяется по прикреплённому видео' : 'Можно заполнить вручную до загрузки видео'}</em>
              </FieldLabel>
              <div className="editor-actions">
                <button type="button" className="pn-button" onClick={removeSelectedLesson}>Удалить урок</button>
              </div>
            </article>
          )}
          <div className="editor-actions">
            <button type="submit" className="pn-button is-dark" disabled={isSaving}>{isSaving ? 'Сохраняем...' : submitLabel}</button>
          </div>
          {message && <p className="pn-text">{message}</p>}
        </form>
      </section>
    </AppShell>
  )
}

function newLesson(): Lesson {
  const id = `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return {
    id,
    databaseId: 0,
    title: '',
    description: '',
    video: '',
    duration: '',
  }
}

function lessonCode(courseId: string, index: number) {
  return `course-${courseId || 'new'}-${index + 1}`
}

function readVideoDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      const minutes = Math.max(1, Math.round(video.duration / 60))
      resolve(`${minutes} мин`)
    }
    video.onerror = () => resolve(null)
    video.src = URL.createObjectURL(file)
  })
}

function lines(value: string[] | string | number) {
  return String(Array.isArray(value) ? value.join('\n') : value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <span>{label}</span>
      {children}
    </div>
  )
}

function FileControl({ id, label, accept, onChange }: { id: string; label: string; accept: string; onChange: (file: File | null) => void }) {
  return (
    <>
      <input className="file-input" id={id} type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      <label className="profile-file-control" htmlFor={id}>
        <span>{label}</span>
      </label>
    </>
  )
}
