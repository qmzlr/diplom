import { router } from '@inertiajs/react'
import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import type { Instrument } from '@/data/courses'
import { postFormData, postJson } from '@/lib/http'

export default function Register({ instruments }: { instruments: Instrument[] }) {
  const [message, setMessage] = useState('')
  const [accountType, setAccountType] = useState<'student' | 'teacher'>('student')
  const [agreed, setAgreed] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [emailVerificationCode, setEmailVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [teacherDocuments, setTeacherDocuments] = useState<File[]>([])
  const [selectedIds, setSelectedIds] = useState(() => new Set(instruments[0]?.id ? [instruments[0].id] : []))
  const [level, setLevel] = useState('Начинающий')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toggleInstrument = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <AppShell>
      <section className="auth-page">
        <div className="auth-visual">
          <img src="/images/work-05.jpg" alt="Instrument" />
          <div>
            <p className="pn-kicker">New student</p>
            <h1>Создайте маршрут обучения</h1>
          </div>
        </div>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!agreed) {
              setMessage('Подтвердите согласие на обработку персональных данных.')
              return
            }

            setIsSubmitting(true)
            setMessage('')

            try {
              if (!isCodeSent) {
                await postJson('/register/email-code', { email })
                setIsCodeSent(true)
                setMessage('Мы отправили код подтверждения на вашу почту. Введите его ниже и завершите регистрацию.')
                return
              }

              const body = new FormData()
              body.append('name', name)
              body.append('email', email)
              body.append('emailVerificationCode', emailVerificationCode)
              body.append('password', password)
              body.append('password_confirmation', passwordConfirmation)
              body.append('accountType', accountType)
              body.append('instrument', instruments.find((item) => selectedIds.has(item.id))?.name ?? '')
              Array.from(selectedIds).forEach((id) => body.append('instrumentIds[]', id))
              if (accountType === 'student') {
                body.append('level', level)
              }
              if (accountType === 'teacher') {
                teacherDocuments.forEach((file) => body.append('teacherDocuments[]', file))
              }

              await postFormData('/register', body)
              router.visit(accountType === 'teacher' ? '/teacher' : '/profile')
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Не удалось создать аккаунт.')
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <p className="pn-kicker">Регистрация</p>
          <h2>Создание аккаунта</h2>
          <div className="account-type-toggle" aria-label="Тип аккаунта">
            <button
              className={accountType === 'student' ? 'is-active' : ''}
              type="button"
              onClick={() => setAccountType('student')}
            >
              Ученик
            </button>
            <button
              className={accountType === 'teacher' ? 'is-active' : ''}
              type="button"
              onClick={() => setAccountType('teacher')}
            >
              Учитель
            </button>
          </div>
          <input className="pn-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" required />
          <input
            className="pn-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setIsCodeSent(false)
              setEmailVerificationCode('')
            }}
            placeholder="Email"
            required
          />
          <input className="pn-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" required />
          <input className="pn-input" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Подтверждение пароля" required />
          {isCodeSent && (
            <input
              className="pn-input"
              inputMode="numeric"
              maxLength={6}
              value={emailVerificationCode}
              onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Код из письма"
              required
            />
          )}
          <div className="pn-meta">{accountType === 'teacher' ? 'Инструменты преподавания' : 'Интересующие инструменты'}</div>
          <div className="dashboard-chip-list profile-instrument-picker auth-instrument-picker" aria-label="Инструменты">
            {instruments.map((instrument) => (
              <label className={`dashboard-chip ${selectedIds.has(instrument.id) ? 'is-selected' : ''}`} key={instrument.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(instrument.id)}
                  onChange={() => toggleInstrument(instrument.id)}
                />
                {instrument.name}
              </label>
            ))}
          </div>
          {accountType === 'student' ? (
            <select className="pn-select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Начинающий</option>
              <option>Базовый</option>
              <option>Средний</option>
            </select>
          ) : (
            <>
              <label className="teacher-documents-field">
                <span>Сертификаты, грамоты, дипломы</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={(e) => setTeacherDocuments(Array.from(e.target.files ?? []))}
                />
                <em>
                  Можно приложить до 8 файлов: PDF, изображения, DOC или DOCX. Модератор увидит их вместе с заявкой.
                </em>
                {teacherDocuments.length > 0 && (
                  <strong>{teacherDocuments.length} файл(а) выбрано</strong>
                )}
              </label>
              <p className="teacher-register-note">После регистрации модератор проверит заявку. Курсы можно будет создавать после одобрения.</p>
            </>
          )}
          <label className="privacy-consent">
            <input
              type="checkbox"
              checked={agreed}
              required
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              Я согласен на обработку персональных данных и ознакомлен с{' '}
              <button type="button" onClick={() => router.visit('/privacy')}>политикой конфиденциальности</button>.
            </span>
          </label>
          <button className="pn-button is-dark" disabled={!agreed || isSubmitting}>
            {isSubmitting ? 'Проверяем...' : isCodeSent ? 'Создать аккаунт' : 'Получить код'}
          </button>
          <button type="button" className="auth-link" onClick={() => router.visit('/login')}>Уже есть аккаунт?</button>
          {message && <p className="pn-text">{message}</p>}
        </form>
      </section>
    </AppShell>
  )
}
