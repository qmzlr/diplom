import { router } from '@inertiajs/react'
import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { postJson } from '@/lib/http'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSendCode = async () => {
    setIsSubmitting(true)
    setMessage('')

    try {
      await postJson('/password/email-code', { email })
      setIsCodeSent(true)
      setMessage('Код восстановления отправлен на вашу почту.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить код.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async () => {
    setIsSubmitting(true)
    setMessage('')

    try {
      await postJson('/password/reset', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      })
      router.visit('/profile')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось обновить пароль.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <section className="auth-page">
        <div className="auth-visual">
          <img src="/images/work-03.jpg" alt="Music practice" />
          <div>
            <p className="pn-kicker">PlayNote account</p>
            <h1>Верните доступ</h1>
          </div>
        </div>
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (isCodeSent) {
              void handleReset()
            } else {
              void handleSendCode()
            }
          }}
        >
          <p className="pn-kicker">Восстановление</p>
          <h2>Новый пароль</h2>
          <input
            className="pn-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setIsCodeSent(false)
              setCode('')
            }}
            placeholder="Email"
            required
          />
          {isCodeSent && (
            <>
              <input
                className="pn-input"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Код из письма"
                required
              />
              <input
                className="pn-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль"
                required
              />
              <input
                className="pn-input"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Подтверждение пароля"
                required
              />
            </>
          )}
          <button className="pn-button is-dark" disabled={isSubmitting}>
            {isSubmitting ? 'Проверяем...' : isCodeSent ? 'Сохранить пароль' : 'Получить код'}
          </button>
          {isCodeSent && (
            <button type="button" className="auth-link" disabled={isSubmitting} onClick={() => void handleSendCode()}>
              Отправить код ещё раз
            </button>
          )}
          <button type="button" className="auth-link" onClick={() => router.visit('/login')}>
            Вернуться ко входу
          </button>
          {message && <p className="pn-text">{message}</p>}
        </form>
      </section>
    </AppShell>
  )
}
