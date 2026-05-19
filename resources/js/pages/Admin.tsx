import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import { initialUploadProgress, UploadProgress } from '@/components/UploadProgress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AdminUser, Course, Instrument } from '@/data/courses'
import { deleteJson, patchJson, postJson, putJson, uploadFormData, type UploadProgressState } from '@/lib/http'
import { toast } from 'sonner'

type Tab = 'Курсы' | 'Пользователи' | 'Инструменты'
type Workspace = 'admin' | 'teacher'

const tabs: Tab[] = ['Курсы', 'Пользователи', 'Инструменты']
const roles: AdminUser['role'][] = ['user', 'teacher', 'moderator', 'admin']
const teacherStatuses: NonNullable<AdminUser['teacherStatus']>[] = ['ожидает', 'одобрен', 'отклонён']
const levels = ['Начинающий', 'Базовый', 'Средний']
const adminPageSize = 8

export default function Admin({
  adminStats,
  courses,
  instruments,
  users,
  workspace = 'admin',
}: {
  adminStats: [string, string][]
  courses: Course[]
  instruments: Instrument[]
  users: AdminUser[]
  workspace?: Workspace
}) {
  const [active, setActive] = useState<Tab | null>(() => tabFromLocation())
  const [query, setQuery] = useState('')
  const [courseItems, setCourseItems] = useState(courses)
  const [userItems, setUserItems] = useState(users)
  const [instrumentItems, setInstrumentItems] = useState(instruments)

  const availableTabs = workspace === 'teacher' ? (['Курсы'] as Tab[]) : tabs
  const resolvedActive = active && availableTabs.includes(active) ? active : null
  const title = workspace === 'teacher' ? 'Кабинет учителя' : 'Панель администратора'
  const text = workspace === 'teacher'
    ? 'Создавайте курсы и отправляйте их на модерацию перед публикацией.'
    : 'Управление курсами, пользователями и инструментами PlayNote.'

  return (
    <AppShell>
      <PageHero eyebrow={workspace === 'teacher' ? 'Teacher studio' : 'System control'} title={title} text={text} image="/images/work-04.jpg" />
      <section className="pn-section admin-section">
        <div className="pn-container">
          <SectionTitle title="Статистика" aside="Система" />
          <div className="admin-stats">
            {adminStats.map(([label, value]) => (
              <article className="pn-card pn-card-body admin-stat-card" key={label}>
                <div className="pn-meta">{label}</div>
                <strong>{value}</strong>
                <span>активно</span>
              </article>
            ))}
          </div>
          {!resolvedActive ? (
            <div className="admin-choice-grid">
              {availableTabs.map((tab) => (
                <button className="pn-card pn-card-body admin-choice-card" key={tab} onClick={() => { setActive(tab); setQuery('') }}>
                  <div className="pn-meta">Раздел</div>
                  <strong>{tab}</strong>
                  <span>{sectionHint(tab)}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="admin-workbench">
                <button className="pn-button" onClick={() => { setActive(null); setQuery('') }}>Назад к разделам</button>
                <input className="pn-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Поиск: ${resolvedActive.toLowerCase()}`} />
              </div>
              {resolvedActive === 'Курсы' && <CoursesPanel courses={courseItems} query={query} workspace={workspace} onChange={setCourseItems} />}
              {workspace === 'admin' && resolvedActive === 'Пользователи' && <UsersPanel instruments={instrumentItems} query={query} users={userItems} onChange={setUserItems} />}
              {workspace === 'admin' && resolvedActive === 'Инструменты' && <InstrumentsPanel instruments={instrumentItems} query={query} onChange={setInstrumentItems} />}
            </>
          )}
        </div>
      </section>
    </AppShell>
  )
}

function CoursesPanel({ courses, query, workspace, onChange }: { courses: Course[]; query: string; workspace: Workspace; onChange: (courses: Course[]) => void }) {
  const rows = filterRows(courses, query, (course) => `${course.id} ${course.title} ${course.instrument} ${course.level} ${course.status ?? ''}`)
  const page = usePagedRows(rows)
  const basePath = workspace === 'teacher' ? '/teacher/courses' : '/admin/courses'

  const remove = async (course: Course) => {
    if (!window.confirm(`Удалить курс "${course.title}"?`)) return
    try {
      await deleteJson('/api/courses/' + course.id)
      onChange(courses.filter((item) => item.id !== course.id))
      toast.success('Курс удалён.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <AdminPanel title="Курсы" aside={`${rows.length} записей`} actionLabel="Создать курс" onAction={() => router.visit(`${basePath}/new`)}>
      <div className="admin-table">
        {page.rows.map((course) => (
          <article className="admin-row" key={course.id}>
            <span><strong>{course.title}</strong><em>{course.id} · {course.instrument} · {course.level} · {course.status ?? 'опубликовано'}</em></span>
            <button className="pn-button" onClick={() => router.visit(`${basePath}/${course.id}/edit`)}>Редактировать</button>
            <button className="pn-button" onClick={() => remove(course)}>Удалить</button>
          </article>
        ))}
      </div>
      <Pagination page={page.page} pageCount={page.pageCount} onPage={page.setPage} />
    </AdminPanel>
  )
}

function UsersPanel({ instruments, query, users, onChange }: { instruments: Instrument[]; query: string; users: AdminUser[]; onChange: (users: AdminUser[]) => void }) {
  const rows = filterRows(users, query, (user) => `${user.name} ${user.email} ${user.role} ${user.instrument}`)
  const page = usePagedRows(rows)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  const toggleBan = async (user: AdminUser) => {
    const nextState = !user.isBanned
    const action = nextState ? 'заблокировать' : 'разблокировать'
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} пользователя "${user.name || user.email}"?`)) return

    try {
      const response = await patchJson<{ user: AdminUser }>(`/api/admin/users/${user.id}/ban`, { isBanned: nextState })
      onChange(users.map((item) => item.id === user.id ? response.user : item))
      toast.success(nextState ? 'Пользователь заблокирован.' : 'Пользователь разблокирован.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <AdminPanel title="Пользователи" aside={`${rows.length} записей`} actionLabel="Создать пользователя" onAction={() => setEditing(emptyUser())}>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="profile-dialog admin-modal">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Редактировать пользователя' : 'Создать пользователя'}</DialogTitle>
            <DialogDescription>Заполните профиль, роль, уровень и интересующие инструменты.</DialogDescription>
          </DialogHeader>
          {editing && <UserForm instruments={instruments} user={editing} onCancel={() => setEditing(null)} onSaved={(user) => {
            onChange(users.some((item) => item.id === user.id) ? users.map((item) => item.id === user.id ? user : item) : [user, ...users])
            setEditing(null)
          }} />}
        </DialogContent>
      </Dialog>
      <div className="admin-table">
        {page.rows.map((user) => (
          <article className="admin-row" key={user.id}>
            <span><strong>{user.name || 'Без имени'}</strong><em>{user.email || 'без email'} · {roleLabel(user.role)}{user.role === 'teacher' ? ` · ${user.teacherStatus || 'ожидает'}` : ''} · {user.instrument || 'инструмент не выбран'}{user.isBanned ? ' · заблокирован' : ''}</em></span>
            <button className="pn-button" onClick={() => setEditing(user)}>Редактировать</button>
            <button className="pn-button" onClick={() => toggleBan(user)}>{user.isBanned ? 'Разбанить' : 'Забанить'}</button>
          </article>
        ))}
      </div>
      <Pagination page={page.page} pageCount={page.pageCount} onPage={page.setPage} />
    </AdminPanel>
  )
}

function UserForm({ instruments, user, onCancel, onSaved }: { instruments: Instrument[]; user: AdminUser; onCancel: () => void; onSaved: (user: AdminUser) => void }) {
  const [form, setForm] = useState({ ...user, password: '' })
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null)
  const isNew = !user.id

  const toggleInstrument = (id: string) => {
    setForm((current) => ({
      ...current,
      instrumentIds: current.instrumentIds.includes(id)
        ? current.instrumentIds.filter((item) => item !== id)
        : [...current.instrumentIds, id],
    }))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      name: form.name || '',
      email: form.email || '',
      password: form.password || undefined,
      role: form.role,
      level: form.level,
      avatar: form.avatar,
      instrumentIds: form.instrumentIds,
      teacherStatus: form.role === 'teacher' ? form.teacherStatus ?? 'ожидает' : null,
    }
    try {
      const response = isNew
        ? await postJson<{ user: AdminUser }>('/api/admin/users', payload)
        : await putJson<{ user: AdminUser }>(`/api/admin/users/${user.id}`, payload)
      onSaved(response.user)
      toast.success(isNew ? 'Пользователь создан.' : 'Пользователь обновлён.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const uploadAvatar = async (file: File | null) => {
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    data.append('type', 'avatar')
    setUploadProgress(initialUploadProgress())
    try {
      const response = await uploadFormData<{ path: string }>('/api/admin/uploads', data, setUploadProgress)
      setForm((current) => ({ ...current, avatar: response.path }))
      toast.success('Фото прикреплено.')
    } catch {
      setUploadProgress((current) => current ? { ...current, status: 'error' } : null)
      toast.error('Не удалось загрузить фото.')
    }
  }

  return (
    <form className="pn-card pn-card-body admin-edit-form" onSubmit={save}>
      <FieldLabel label="Имя"><input className="pn-input" value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></FieldLabel>
      <FieldLabel label="Email"><input className="pn-input" type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FieldLabel>
      <FieldLabel label={isNew ? 'Пароль' : 'Новый пароль'}>
        <input className="pn-input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isNew ? '' : 'Оставьте пустым, если не меняется'} required={isNew} />
      </FieldLabel>
      <FieldLabel label="Фото профиля">
        <label className="profile-file-control">
          <span>{form.avatar ? 'Фото прикреплено' : 'Прикрепить фото'}</span>
          <input type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0] ?? null)} />
        </label>
        <UploadProgress progress={uploadProgress} />
      </FieldLabel>
      <FieldLabel label="Роль">
        <select className="pn-select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminUser['role'] })}>
          {roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
        </select>
      </FieldLabel>
      {form.role === 'teacher' && (
        <FieldLabel label="Статус учителя">
          <select className="pn-select" value={form.teacherStatus || 'ожидает'} onChange={(event) => setForm({ ...form, teacherStatus: event.target.value as AdminUser['teacherStatus'] })}>
            {teacherStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </FieldLabel>
      )}
      <FieldLabel label="Уровень">
        <select className="pn-select" value={form.level || 'Начинающий'} onChange={(event) => setForm({ ...form, level: event.target.value })}>
          {levels.map((level) => <option key={level}>{level}</option>)}
        </select>
      </FieldLabel>
      <FieldLabel label="Инструменты">
        <div className="dashboard-chip-list profile-instrument-picker">
          {instruments.map((instrument) => (
            <label className={`dashboard-chip ${form.instrumentIds.includes(instrument.id) ? 'is-selected' : ''}`} key={instrument.id}>
              <input type="checkbox" checked={form.instrumentIds.includes(instrument.id)} onChange={() => toggleInstrument(instrument.id)} />
              {instrument.name}
            </label>
          ))}
        </div>
      </FieldLabel>
      <div className="editor-actions">
        <button className="pn-button is-dark">Сохранить</button>
        <button type="button" className="pn-button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  )
}

function InstrumentsPanel({ instruments, query, onChange }: { instruments: Instrument[]; query: string; onChange: (items: Instrument[]) => void }) {
  const rows = filterRows(instruments, query, (instrument) => `${instrument.id} ${instrument.name} ${instrument.description}`)
  const page = usePagedRows(rows)
  const [editing, setEditing] = useState<Instrument | null>(null)

  const remove = async (instrument: Instrument) => {
    if (!window.confirm(`Удалить инструмент "${instrument.name}"?`)) return
    try {
      await deleteJson('/api/admin/instruments/' + instrument.id)
      onChange(instruments.filter((item) => item.id !== instrument.id))
      toast.success('Инструмент удалён.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <AdminPanel title="Инструменты" aside={`${rows.length} записей`} actionLabel="Создать инструмент" onAction={() => setEditing(emptyInstrument())}>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="profile-dialog admin-modal">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Редактировать инструмент' : 'Создать инструмент'}</DialogTitle>
            <DialogDescription>Настройте slug, название, изображение и описание инструмента.</DialogDescription>
          </DialogHeader>
          {editing && <InstrumentForm instrument={editing} onCancel={() => setEditing(null)} onSaved={(instrument) => {
            onChange(instruments.some((item) => item.id === instrument.id) ? instruments.map((item) => item.id === instrument.id ? instrument : item) : [...instruments, instrument])
            setEditing(null)
          }} />}
        </DialogContent>
      </Dialog>
      <div className="admin-table">
        {page.rows.map((instrument) => (
          <article className="admin-row" key={instrument.id}>
            <span><strong>{instrument.name}</strong><em>{instrument.id} · {instrument.courseCount} курсов</em></span>
            <button className="pn-button" onClick={() => setEditing(instrument)}>Редактировать</button>
            <button className="pn-button" onClick={() => remove(instrument)}>Удалить</button>
          </article>
        ))}
      </div>
      <Pagination page={page.page} pageCount={page.pageCount} onPage={page.setPage} />
    </AdminPanel>
  )
}

function InstrumentForm({ instrument, onCancel, onSaved }: { instrument: Instrument; onCancel: () => void; onSaved: (instrument: Instrument) => void }) {
  const [form, setForm] = useState(instrument)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null)
  const isNew = !instrument.id

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      slug: form.id,
      name: form.name,
      image: form.image,
      description: form.description,
    }
    try {
      const response = isNew
        ? await postJson<{ instrument: Instrument }>('/api/admin/instruments', payload)
        : await putJson<{ instrument: Instrument }>(`/api/admin/instruments/${instrument.id}`, payload)
      onSaved(response.instrument)
      toast.success(isNew ? 'Инструмент создан.' : 'Инструмент обновлён.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const uploadImage = async (file: File | null) => {
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    data.append('type', 'image')
    setUploadProgress(initialUploadProgress())

    try {
      const response = await uploadFormData<{ path: string }>('/api/admin/uploads', data, setUploadProgress)
      setForm((current) => ({ ...current, image: response.path }))
      toast.success('Изображение прикреплено.')
    } catch (error) {
      setUploadProgress((current) => current ? { ...current, status: 'error' } : null)
      toast.error(errorMessage(error))
    }
  }

  return (
    <form className="pn-card pn-card-body admin-edit-form" onSubmit={save}>
      <FieldLabel label="Slug"><input className="pn-input" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} required /></FieldLabel>
      <FieldLabel label="Название"><input className="pn-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></FieldLabel>
      <FieldLabel label="Изображение">
        <FileControl id={`instrument-image-${form.id || 'new'}`} label={form.image ? 'Изображение прикреплено' : 'Добавить изображение'} accept="image/*" onChange={uploadImage} />
        <AttachmentStatus value={form.image} emptyText="Изображение пока не выбрано." />
        <UploadProgress progress={uploadProgress} />
      </FieldLabel>
      <FieldLabel label="Описание"><textarea className="pn-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></FieldLabel>
      <div className="readonly-field"><span>Количество курсов</span><strong>{form.courseCount}</strong><em>Рассчитывается из базы данных</em></div>
      <div className="editor-actions">
        <button className="pn-button is-dark">Сохранить</button>
        <button type="button" className="pn-button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  )
}

function AdminPanel({ title, aside, actionLabel, onAction, children }: { title: string; aside: string; actionLabel?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <SectionTitle title={title} aside={aside} />
        {actionLabel && <button className="pn-button is-dark" onClick={onAction}>{actionLabel}</button>}
      </div>
      {children}
    </section>
  )
}

function filterRows<T>(rows: T[], query: string, getText: (row: T) => string) {
  const value = query.trim().toLowerCase()
  return value ? rows.filter((row) => getText(row).toLowerCase().includes(value)) : rows
}

function emptyUser(): AdminUser {
  return {
    id: '',
    name: '',
    email: '',
    avatar: '',
    role: 'user',
    teacherStatus: null,
    isBanned: false,
    instrument: '',
    level: 'Начинающий',
    instrumentIds: [],
  }
}

function emptyInstrument(): Instrument {
  return {
    id: '',
    name: '',
    image: '',
    description: '',
    courseCount: 0,
  }
}

function roleLabel(role: AdminUser['role']) {
  if (role === 'admin') return 'Администратор'
  if (role === 'moderator') return 'Модератор'
  if (role === 'teacher') return 'Учитель'
  return 'Ученик'
}

function sectionHint(tab: Tab) {
  if (tab === 'Курсы') return 'Создание, редактирование и удаление программ'
  if (tab === 'Пользователи') return 'Роли, уровни, инструменты и профиль'
  return 'Каталог направлений и обложки'
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <span>{label}</span>
      {children}
    </div>
  )
}

function usePagedRows<T>(rows: T[]) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rows.length / adminPageSize))
  const currentPage = Math.min(page, pageCount)

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount)
    }
  }, [page, pageCount])

  return {
    page: currentPage,
    pageCount,
    setPage,
    rows: rows.slice((currentPage - 1) * adminPageSize, currentPage * adminPageSize),
  }
}

function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
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

function tabFromLocation(): Tab | null {
  const section = new URLSearchParams(window.location.search).get('section')
  const match: Record<string, Tab> = {
    courses: 'Курсы',
    users: 'Пользователи',
    instruments: 'Инструменты',
  }

  return section ? match[section] ?? null : null
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

function AttachmentStatus({ value, emptyText }: { value: string; emptyText: string }) {
  if (!value) {
    return <em>{emptyText}</em>
  }

  return <em className="attachment-status">Прикреплено: {fileName(value)}</em>
}

function fileName(value: string) {
  return value.split('/').filter(Boolean).at(-1) ?? value
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить действие.'
}
