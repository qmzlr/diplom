import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { postJson } from '@/lib/http'

export default function Hero() {
  const [submitHovered, setSubmitHovered] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instrument: 'Гитара',
    level: 'Новичок',
    goal: 'Играть песни',
  })

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }))
    }
  }, [user])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!formData.name || !formData.email) {
      setSubmitError('Пожалуйста, заполните обязательные поля.')
      return
    }

    setIsSubmitting(true)
    postJson<{ success: boolean }>('/course-requests', {
      name: formData.name,
      email: formData.email,
      instrument: formData.instrument,
      level: formData.level,
      goal: formData.goal,
    })
      .then(() => {
        setSubmitted(true)
        setSubmitError(null)
      })
      .catch((err) => {
        setSubmitError(err.message || 'Что-то пошло не так. Попробуйте снова.')
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <section
      id="matching"
      className="matching-section"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '760px',
        backgroundColor: '#0b0b0b',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
      }}
    >
      {/* Left: image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '420px',
          overflow: 'hidden',
        }}
      >
        <img
          src="/images/form-bg.jpg"
          alt="Music instruments"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.45) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(24px, 4vw, 48px)',
            left: 'clamp(24px, 4vw, 48px)',
            right: 'clamp(24px, 4vw, 48px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              color: '#ffffff',
              marginBottom: '16px',
              textShadow: '0 2px 24px rgba(0,0,0,0.25)',
              maxWidth: '520px',
            }}
          >
            Подобрать
            <br />
            курс
          </h2>
          <p
            style={{
              fontSize: '13px',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase',
            }}
          >
            PLAYNOTE · Персональный учебный маршрут
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div
        style={{
          backgroundColor: '#0b0b0b',
          color: '#ffffff',
          padding: 'clamp(40px, 5vw, 72px) clamp(24px, 4vw, 60px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '0.24em',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            Определить уровень
          </p>
          <h3
            style={{
              fontSize: 'clamp(28px, 3.2vw, 40px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '20px',
            }}
          >
            Ответьте на несколько вопросов, и платформа поможет выбрать подходящее направление обучения.
          </h3>
          <p className="matching-note">
            Подбор занимает меньше минуты. Мы сохраним ваши ответы и предложим стартовый курс,
            темп занятий и практические упражнения под выбранный инструмент.
          </p>

          {submitted ? (
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.4)',
                padding: '32px 28px',
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              Спасибо — наша команда подготовит персональные рекомендации и отправит их
              на вашу почту в течение 24 часов.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {submitError && (
                <div
                  style={{
                    border: '1px solid rgba(255,100,100,0.5)',
                    padding: '14px 18px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: 'rgba(255,150,150,0.9)',
                    marginBottom: '4px',
                  }}
                >
                  {submitError}
                </div>
              )}
              <Field label="Имя" type="text" name="name" placeholder="Иван Иванов" value={formData.name} onChange={handleChange} />
              <Field label="Email" type="email" name="email" placeholder="you@domain.com" value={formData.email} onChange={handleChange} />
              <SelectField
                label="Выберите инструмент"
                name="instrument"
                value={formData.instrument}
                onChange={handleChange}
                options={[
                  'Гитара',
                  'Фортепиано',
                  'Барабаны',
                  'Вокал',
                  'Укулеле',
                  'Другое',
                ]}
              />
              <SelectField
                label="Уровень подготовки"
                name="level"
                value={formData.level}
                onChange={handleChange}
                options={[
                  'Новичок',
                  'Базовый',
                  'Средний',
                ]}
              />
              <SelectField
                label="Цель обучения"
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                options={[
                  'Играть песни',
                  'Развить технику',
                  'Изучить теорию',
                  'Улучшить ритм',
                ]}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
                style={{
                  marginTop: '12px',
                  padding: '18px 24px',
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '0.16em',
                  color: submitHovered ? '#0b0b0b' : '#ffffff',
                  backgroundColor: submitHovered ? '#ffffff' : 'transparent',
                  border: '1px solid #ffffff',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.25s ease',
                  fontFamily: 'var(--pn-font-main)',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Отправка...' : 'Подобрать обучение'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
}: {
  label: string
  type: string
  name: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelBase}>{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={fieldBase}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#ffffff')}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.35)')}
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string
  name: string
  options: string[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelBase}>{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{ ...fieldBase, paddingRight: '20px' }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#ffffff')}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.35)')}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ color: '#000', backgroundColor: '#fff' }}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  )
}

const fieldBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  fontSize: '15px',
  backgroundColor: 'transparent',
  color: '#ffffff',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.35)',
  outline: 'none',
  fontFamily: 'inherit',
  letterSpacing: '0.01em',
  appearance: 'none',
  colorScheme: 'dark',
}

const labelBase: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase',
  marginBottom: '4px',
  display: 'block',
}
