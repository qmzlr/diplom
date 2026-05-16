import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'
import type { CommentItem, UserVideo } from '@/data/courses'
import { useAuth } from '@/hooks/useAuth'
import { postJson } from '@/lib/http'

export default function CommunityVideo({
  canComment,
  comments,
  video,
}: {
  canComment: boolean
  comments: CommentItem[]
  video: UserVideo
}) {
  const { isAuthenticated } = useAuth()
  const [items] = useState(comments)
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isAuthenticated) {
      router.visit('/login')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      await postJson<{ comment: CommentItem }>('/api/comments', {
        text,
        targetType: 'video',
        targetCode: numericId(video.id),
      })
      setText('')
      setMessage('Комментарий отправлен на модерацию.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить комментарий.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <PageHero eyebrow={`${video.instrument} · ${video.author}`} title={video.title} text={video.description || 'Видео сообщества PlayNote'} image={video.image} />
      <section className="pn-section community-video-page">
        <div className="pn-container community-video-layout">
          <article className="pn-card pn-card-body community-video-player-card">
            {video.video ? (
              <video className="selected-video-player" src={video.video} poster={video.image} controls />
            ) : (
              <img src={video.image} alt={video.title} />
            )}
            <div className="community-video-author">
              {video.authorAvatar ? <img src={video.authorAvatar} alt="" /> : <span>{video.author.slice(0, 1)}</span>}
              <div>
                <div className="pn-meta">Автор</div>
                <strong>{video.author}</strong>
              </div>
            </div>
          </article>
          <aside className="community-video-sidebar">
            <article className="pn-card pn-card-body">
              <div className="pn-meta">{video.status}</div>
              <h2 className="pn-title">{video.title}</h2>
              <p className="pn-text">{video.description}</p>
              <div className="pn-meta">{video.instrument}</div>
            </article>
            <article className="pn-card pn-card-body">
              <SectionTitle title="Комментарии" aside={`${items.length} записей`} />
              <div className="comments-list community-video-comments">
                {items.map((comment) => (
                  <article className="pn-card pn-card-body" key={comment.id}>
                    <div className="pn-meta">{comment.author}</div>
                    <p>{comment.text}</p>
                  </article>
                ))}
                {items.length === 0 && <p className="pn-text">Пока нет одобренных комментариев.</p>}
              </div>
              {canComment ? (
                <form className="comment-form" onSubmit={submit}>
                  <textarea className="pn-textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Оставьте комментарий к видео" required />
                  <button className="pn-button is-dark" disabled={isSubmitting || !text.trim()}>{isSubmitting ? 'Отправляем...' : 'Отправить на модерацию'}</button>
                </form>
              ) : (
                <button className="pn-button is-dark" onClick={() => router.visit('/login')}>Войти, чтобы комментировать</button>
              )}
              {message && <p className="pn-text">{message}</p>}
            </article>
          </aside>
        </div>
      </section>
    </AppShell>
  )
}

function numericId(id: string) {
  return id.replace(/^\D+/, '')
}
