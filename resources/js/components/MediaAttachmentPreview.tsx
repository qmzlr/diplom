import { useEffect, useMemo, useState } from 'react'

type PreviewKind = 'image' | 'video' | 'file'

type MediaAttachmentPreviewProps = {
  value?: string | File | null
  values?: File[]
  kind?: PreviewKind
  emptyText?: string
}

export function MediaAttachmentPreview({ value, values, kind, emptyText = 'Файл пока не выбран.' }: MediaAttachmentPreviewProps) {
  if (values) {
    if (values.length === 0) {
      return <em className="attachment-status">{emptyText}</em>
    }

    return (
      <div className="attachment-preview-list">
        {values.map((file) => (
          <SinglePreview key={`${file.name}-${file.size}-${file.lastModified}`} value={file} kind={kind} />
        ))}
      </div>
    )
  }

  if (!value) {
    return <em className="attachment-status">{emptyText}</em>
  }

  return <SinglePreview value={value} kind={kind} />
}

function SinglePreview({ value, kind }: { value: string | File; kind?: PreviewKind }) {
  const fileUrl = useMemo(() => typeof value === 'string' ? null : URL.createObjectURL(value), [value])
  const [isOpen, setIsOpen] = useState(false)
  const source = typeof value === 'string' ? value : fileUrl
  const filename = typeof value === 'string' ? fileName(value) : value.name
  const resolvedKind = kind ?? inferKind(value)
  const canPreview = Boolean(source && (resolvedKind === 'image' || resolvedKind === 'video'))

  useEffect(() => {
    if (!fileUrl) return
    return () => URL.revokeObjectURL(fileUrl)
  }, [fileUrl])

  const canOpen = Boolean(source)

  return (
    <div className="attachment-preview">
      {source && resolvedKind === 'image' && <img src={source} alt={filename} />}
      {source && resolvedKind === 'video' && <video src={source} controls preload="metadata" />}
      {resolvedKind === 'file' && <div className="attachment-preview__placeholder">FILE</div>}
      <div className="attachment-preview__meta">
        <strong>{filename}</strong>
        <span>{resolvedKind === 'image' ? 'изображение' : resolvedKind === 'video' ? 'видео' : 'файл'}</span>
        {canPreview ? (
          <button type="button" className="attachment-preview__open" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? 'Свернуть' : 'Открыть'}
          </button>
        ) : canOpen && (
          <a className="attachment-preview__open" href={source ?? undefined} download={typeof value === 'string' ? undefined : filename}>
            Открыть
          </a>
        )}
      </div>
      {isOpen && source && (
        <div className="attachment-preview__viewer">
          {resolvedKind === 'image' && <img src={source} alt={filename} />}
          {resolvedKind === 'video' && <video src={source} controls autoPlay preload="metadata" />}
        </div>
      )}
    </div>
  )
}

function inferKind(value: string | File): PreviewKind {
  if (value instanceof File) {
    if (value.type.startsWith('image/')) return 'image'
    if (value.type.startsWith('video/')) return 'video'
    return 'file'
  }

  const path = value.split('?')[0].toLowerCase()
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(path)) return 'image'
  if (/\.(mp4|webm|mov|m4v|avi|wmv)$/.test(path)) return 'video'
  return 'file'
}

function fileName(value: string) {
  return value.split('/').filter(Boolean).at(-1) ?? value
}
