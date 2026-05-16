import type { UploadProgressState } from '@/lib/http'

export function UploadProgress({ progress }: { progress: UploadProgressState | null }) {
  if (!progress || progress.status === 'idle') {
    return null
  }

  const percent = progress.percent ?? 0

  return (
    <div className={`upload-progress upload-progress--${progress.status}`} aria-live="polite">
      <div className="upload-progress__track">
        <span style={{ width: progress.percent === null ? '42%' : `${percent}%` }} />
      </div>
      <p>
        {progress.status === 'done'
          ? 'Файл прикреплён'
          : progress.status === 'error'
            ? 'Загрузка не удалась'
            : progress.percent === null
              ? `Загружаем ${formatBytes(progress.loaded)}`
              : `${percent}% · ${formatBytes(progress.loaded)} из ${formatBytes(progress.total ?? 0)}${progress.etaSeconds ? ` · осталось примерно ${formatTime(progress.etaSeconds)}` : ''}`}
      </p>
    </div>
  )
}

export function initialUploadProgress(): UploadProgressState {
  return {
    percent: null,
    loaded: 0,
    total: null,
    elapsedMs: 0,
    etaSeconds: null,
    status: 'idle',
  }
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 Б'
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds} сек`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} мин ${rest} сек` : `${minutes} мин`
}
