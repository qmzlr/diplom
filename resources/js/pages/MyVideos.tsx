import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell, PageHero } from '@/components/AppShell'
import { MediaAttachmentPreview } from '@/components/MediaAttachmentPreview'
import { initialUploadProgress, UploadProgress } from '@/components/UploadProgress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Instrument, UserVideo } from '@/data/courses'
import { useAuth } from '@/hooks/useAuth'
import { uploadFormData, type UploadProgressState } from '@/lib/http'

const pageSize = 6

export default function MyVideos({ instruments, userVideos }: { instruments: Instrument[]; userVideos: UserVideo[] }) {
  const { isAuthenticated } = useAuth()
  const [videos, setVideos] = useState<UserVideo[]>(userVideos)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instrument, setInstrument] = useState(instruments[0]?.name ?? '')
  const [instrumentFilter, setInstrumentFilter] = useState('Все')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoInputKey, setVideoInputKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !videoFile) return

    setIsUploading(true)
    setUploadProgress(initialUploadProgress())
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('instrument', instrument)
      formData.append('image', instruments.find((item) => item.name === instrument)?.image || '/images/course-theory.jpg')
      formData.append('video', videoFile)

      const payload = await uploadFormData<{ video: UserVideo }>('/api/videos', formData, setUploadProgress)

      setVideos((items) => [payload.video, ...items])
      setTitle('')
      setDescription('')
      setVideoFile(null)
      setVideoInputKey((value) => value + 1)
      setMessage('Видео отправлено на модерацию.')
      setIsUploadDialogOpen(false)
    } catch (error) {
      setUploadProgress((current) => current ? { ...current, status: 'error' } : null)
      setMessage(error instanceof Error ? error.message : 'Не удалось загрузить видео.')
    } finally {
      setIsUploading(false)
    }
  }

  const publicVideos = videos.filter((video) => video.status === 'опубликовано')
  const feedVideos = publicVideos.filter((video) => instrumentFilter === 'Все' || video.instrument === instrumentFilter)
  const pageCount = Math.max(1, Math.ceil(feedVideos.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleVideos = feedVideos.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <AppShell>
      <PageHero
        eyebrow="Сообщество PlayNote"
        title="Сообщество"
        text="Смотрите практику учеников, разбирайте идеи для занятий и делитесь своими музыкальными видео."
        image="/images/form-bg.jpg"
      />
      <section className="pn-section">
        <div className="pn-container community-layout">
          {isAuthenticated ? (
            <article className="pn-card pn-card-body community-upload-card">
              <div>
                <div className="pn-meta">Для учеников</div>
                <h3 className="pn-title">Поделитесь практикой</h3>
                <p className="pn-text">Видео появится в ленте после модерации.</p>
              </div>
              <button className="pn-button is-dark" onClick={() => setIsUploadDialogOpen(true)}>Загрузить своё видео</button>
              {message && <p className="pn-text">{message}</p>}
            </article>
          ) : (
            <article className="pn-card pn-card-body community-login-card">
              <div className="pn-meta">Только для учеников</div>
              <h3 className="pn-title">Войдите, чтобы загрузить видео</h3>
              <p className="pn-text">
                Лента сообщества открыта всем, а публикация домашних практик доступна после входа в аккаунт.
              </p>
              <button className="pn-button is-dark" onClick={() => router.visit('/login')}>
                Войти
              </button>
            </article>
          )}
          <div className="community-content">
            <div className="community-heading">
              <div>
                <p className="pn-meta">Лента учеников</p>
                <h2>Видео сообщества</h2>
              </div>
              <span>{feedVideos.length} записей</span>
            </div>
            <label className="catalog-filter community-filter">
              <span>Инструмент</span>
              <select
                className="pn-select"
                value={instrumentFilter}
                onChange={(e) => {
                  setInstrumentFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option>Все</option>
                {instruments.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <div className="video-list">
              {visibleVideos.length > 0 ? visibleVideos.map((video) => (
                <button key={video.id} className="pn-card video-row" onClick={() => router.visit(video.detailUrl ?? '/community')}>
                  <img src={video.image} alt={video.title} />
                  <span>
                    <em>{video.status}</em>
                    <strong>{video.title}</strong>
                    <small>Автор: {video.author}</small>
                    <small>{video.instrument}</small>
                  </span>
                </button>
              )) : <p className="pn-text community-empty">Опубликованных видео по этому инструменту пока нет.</p>}
            </div>
            {feedVideos.length > pageSize && (
              <div className="community-pagination">
                <button className="pn-button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Назад</button>
                <div className="pagination-pages" aria-label="Страницы видео сообщества">
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      className={`pagination-page ${pageNumber === currentPage ? 'is-active' : ''}`}
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
                <button className="pn-button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Далее</button>
              </div>
            )}
          </div>
        </div>
      </section>
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="profile-dialog community-upload-dialog">
          <DialogHeader>
            <DialogTitle>Загрузить своё видео</DialogTitle>
            <DialogDescription>Прикрепите видеофайл с практикой. После загрузки запись отправится на модерацию.</DialogDescription>
          </DialogHeader>
          <form className="upload-form" onSubmit={submit}>
            <input className="pn-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название видео" />
            <textarea className="pn-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
            <select className="pn-select" value={instrument} onChange={(e) => setInstrument(e.target.value)}>
              {instruments.map((item) => <option key={item.id}>{item.name}</option>)}
            </select>
            <label className="profile-file-control community-video-file">
              <span>{videoFile ? videoFile.name : 'Прикрепить видео'}</span>
              <input key={videoInputKey} type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
            </label>
            <MediaAttachmentPreview value={videoFile} kind="video" emptyText="Видео пока не выбрано." />
            <UploadProgress progress={uploadProgress} />
            <button className="pn-button is-dark" disabled={isUploading || !videoFile}>{isUploading ? 'Загружаем...' : 'Загрузить'}</button>
            {message && isUploadDialogOpen && <p className="pn-text">{message}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
