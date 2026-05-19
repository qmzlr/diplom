import { useEffect, useState } from 'react'

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
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const source = typeof value === 'string' ? value : fileUrl
  const filename = typeof value === 'string' ? fileName(value) : value.name
  const resolvedKind = kind ?? inferKind(value)

  useEffect(() => {
    if (typeof value === 'string') {
      setFileUrl(null)
      return
    }

    const url = URL.createObjectURL(value)
    setFileUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [value])

  const canOpen = Boolean(source)

  return (
    <div className="attachment-preview">
      {source && resolvedKind === 'image' && <img src={source} alt={filename} />}
      {source && resolvedKind === 'video' && <video src={source} controls preload="metadata" />}
      {resolvedKind === 'file' && <div className="attachment-preview__placeholder">FILE</div>}
      <div className="attachment-preview__meta">
        <strong>{filename}</strong>
        <span>{resolvedKind === 'image' ? 'изображение' : resolvedKind === 'video' ? 'видео' : 'файл'}</span>
        {canOpen && (
          <a href={source ?? undefined} target="_blank" rel="noreferrer">
            Открыть
          </a>
        )}
      </div>
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
