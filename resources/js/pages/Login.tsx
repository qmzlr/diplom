import { router } from '@inertiajs/react'
import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { postJson } from '@/lib/http'

export default function Login() {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <AppShell>
      <section className="auth-page">
        <div className="auth-visual">
          <img src="/images/work-03.jpg" alt="Music practice" />
          <div>
            <p className="pn-kicker">PlayNote account</p>
            <h1>Вернитесь к практике</h1>
          </div>
        </div>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault()
            setIsSubmitting(true)
            setMessage('')

            try {
              await postJson('/login', { email, password })
              router.visit('/profile')
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Не удалось войти.')
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <p className="pn-kicker">Вход</p>
          <h2>Авторизация</h2>
          <input className="pn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input className="pn-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" required />
          <button className="pn-button is-dark" disabled={isSubmitting}>{isSubmitting ? 'Входим...' : 'Войти'}</button>
          <button type="button" className="auth-link" onClick={() => router.visit('/forgot-password')}>Забыли пароль?</button>
          <button type="button" className="auth-link" onClick={() => router.visit('/register')}>Создать аккаунт</button>
          {message && <p className="pn-text">{message}</p>}
        </form>
      </section>
    </AppShell>
  )
}
