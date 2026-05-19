type JsonBody = Record<string, unknown>

export type UploadProgressState = {
  percent: number | null
  loaded: number
  total: number | null
  elapsedMs: number
  etaSeconds: number | null
  status: 'idle' | 'uploading' | 'done' | 'error'
}

function csrfToken() {
  return document
    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    ?.getAttribute('content')
}

function responseMessage(payload: any) {
  const firstFieldError = payload?.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : null

  return String(
    firstFieldError ||
      payload?.message ||
      payload?.error ||
      'Что-то пошло не так. Попробуйте снова.',
  )
}

export async function postJson<T>(url: string, body: JsonBody = {}): Promise<T> {
  return sendJson<T>('POST', url, body)
}

export async function postFormData<T>(url: string, body: FormData): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken()! } : {}),
    },
    body,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(responseMessage(payload))
  }

  return payload as T
}

export function uploadFormData<T>(
  url: string,
  body: FormData,
  onProgress?: (progress: UploadProgressState) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const startedAt = performance.now()

    const emit = (
      loaded: number,
      total: number | null,
      status: UploadProgressState['status'] = 'uploading',
    ) => {
      const elapsedMs = Math.max(1, performance.now() - startedAt)
      const percent = total && total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null
      const bytesPerSecond = loaded / (elapsedMs / 1000)
      const remainingBytes = total && total > loaded ? total - loaded : 0
      const etaSeconds = total && bytesPerSecond > 0 && remainingBytes > 0
        ? Math.ceil(remainingBytes / bytesPerSecond)
        : null

      onProgress?.({
        percent,
        loaded,
        total,
        elapsedMs,
        etaSeconds,
        status,
      })
    }

    request.open('POST', url)
    request.withCredentials = true
    request.setRequestHeader('Accept', 'application/json')
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest')

    const token = csrfToken()
    if (token) {
      request.setRequestHeader('X-CSRF-TOKEN', token)
    }

    request.upload.onprogress = (event) => {
      emit(event.loaded, event.lengthComputable ? event.total : null)
    }

    request.onload = () => {
      let payload: any = null
      try {
        payload = request.responseText ? JSON.parse(request.responseText) : null
      } catch {
        payload = null
      }
      emit(request.upload ? 1 : 0, request.upload ? 1 : null, request.status >= 200 && request.status < 300 ? 'done' : 'error')

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(responseMessage(payload)))
        return
      }

      resolve(payload as T)
    }

    request.onerror = () => {
      emit(0, null, 'error')
      reject(new Error('Не удалось загрузить файл. Проверьте соединение.'))
    }

    request.send(body)
  })
}

export async function putJson<T>(url: string, body: JsonBody = {}): Promise<T> {
  return sendJson<T>('PUT', url, body)
}

export async function patchJson<T>(url: string, body: JsonBody = {}): Promise<T> {
  return sendJson<T>('PATCH', url, body)
}

export async function deleteJson<T>(url: string): Promise<T> {
  return sendJson<T>('DELETE', url)
}

async function sendJson<T>(method: string, url: string, body?: JsonBody): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken() ? { 'X-CSRF-TOKEN': csrfToken()! } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(responseMessage(payload))
  }

  return payload as T
}
