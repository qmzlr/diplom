import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { GlowCard } from '@/components/ui/spotlight-card'

const features: { label: string; detail: string }[] = [
  { label: 'Видеобиблиотека', detail: 'Сотни видеоуроков по всем инструментам с разбором техники' },
  { label: 'Каталог курсов', detail: 'Структурированные программы от нуля до уверенного уровня' },
  { label: 'Личный кабинет', detail: 'Удобный доступ к прогрессу, закладкам и истории занятий' },
  { label: 'Отслеживание прогресса', detail: 'Визуальная статистика практики и достижений' },
  { label: 'Комментарии', detail: 'Обсуждайте уроки, задавайте вопросы и делитесь опытом' },
  { label: 'Видео учеников', detail: 'Загружайте свои записи и получайте обратную связь' },
  { label: 'Персональные рекомендации', detail: 'ИИ-подборка курсов и уроков под ваш уровень' },
  { label: 'Встроенный метроном', detail: 'Тренируйте ритм с визуальным и звуковым сопровождением' },
]

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {})
  }, [])

  return (
    <section
      id="features"
      ref={sectionRef}
      className="capabilities-section"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0b0b0b',
        padding: 'clamp(100px, 12vw, 160px) clamp(20px, 4vw, 60px)',
      }}
    >
      <video
        ref={videoRef}
        src="/videos/capabilities-keyboard.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-label="Piano lesson background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.68), rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.62)), linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.7))',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Top: title row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(32px, 6vw, 80px)',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: '60px',
            paddingBottom: '28px',
            borderBottom: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          <div style={{ flex: '1 1 500px' }}>
            <p
              style={{
                fontSize: '11px',
                letterSpacing: '0.24em',
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                marginBottom: '18px',
              }}
            >
              Возможности платформы
            </p>
            <h2
              style={{
                fontSize: 'clamp(40px, 6vw, 80px)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: '#ffffff',
                marginBottom: '24px',
              }}
            >
              Всё, что нужно для комфортного обучения
            </h2>
            <p
              style={{
                fontSize: 'clamp(15px, 1.2vw, 18px)',
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.78)',
                maxWidth: '640px',
              }}
            >
              PlayNote объединяет все инструменты для самостоятельного музыкального
              развития в одной платформе. Вот что доступно каждому ученику:
            </p>
          </div>
          <div
            style={{
              flex: '0 0 clamp(180px, 22vw, 280px)',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <OrbitalBadge />
          </div>
        </div>

        {/* Bullet grid */}
        <ul
          className="capabilities-grid"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 'clamp(14px, 1.6vw, 24px)',
          }}
        >
          {features.map((feature, i) => (
            <BulletItem key={feature.label} index={i} {...feature} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function BulletItem({
  label,
  detail,
  index,
}: {
  label: string
  detail: string
  index: number
}) {
  return (
    <li className="capability-card-shell">
      <GlowCard customSize glowColor="orange" className="capability-glow-card">
        <span className="capability-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="capability-copy">
          <h3>{label}</h3>
          <p>{detail}</p>
        </div>
      </GlowCard>
    </li>
  )
}

function OrbitalBadge() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const pathId = `orbital-path-${Math.floor(Math.random() * 10000)}`
    const duration = 25

    const path = svg.querySelector('path')
    if (!path) return

    path.setAttribute('id', pathId)
    path.setAttribute('fill', 'none')

    const textContent = 'PLAYNOTE \u2022 MUSIC PLATFORM \u2022 LEARN YOUR WAY \u2022 '

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    textEl.setAttribute('fill', '#ffffff')
    textEl.setAttribute('font-family', 'Helvetica Neue, PingFang SC, Microsoft YaHei, sans-serif')
    textEl.setAttribute('font-size', '18px')
    textEl.setAttribute('font-weight', '500')
    textEl.setAttribute('letter-spacing', '2px')

    const tp1 = document.createElementNS('http://www.w3.org/2000/svg', 'textPath')
    tp1.setAttribute('href', `#${pathId}`)
    tp1.setAttribute('startOffset', '0%')
    tp1.textContent = textContent

    const tp2 = document.createElementNS('http://www.w3.org/2000/svg', 'textPath')
    tp2.setAttribute('href', `#${pathId}`)
    tp2.setAttribute('startOffset', '0%')
    tp2.textContent = textContent

    textEl.appendChild(tp1)
    textEl.appendChild(tp2)
    svg.appendChild(textEl)

    const textPaths = svg.querySelectorAll('textPath')

    const tween1 = gsap.fromTo(
      textPaths[0],
      { attr: { startOffset: '0%' } },
      { attr: { startOffset: '-100%' }, duration, ease: 'none', repeat: -1 }
    )

    const tween2 = gsap.fromTo(
      textPaths[1],
      { attr: { startOffset: '100%' } },
      { attr: { startOffset: '0%' }, duration, ease: 'none', repeat: -1 }
    )

    return () => {
      tween1.kill()
      tween2.kill()
    }
  }, [])

  return (
    <div
      className="orbital-svg-container"
      style={{
        width: '100%',
        height: '100%',
        transform: 'rotate(-15deg)',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        style={{ width: '100%', height: '100%' }}
      >
        <path
          d="M200,40 A160,160 0 1,1 199.99,40"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.5"
          opacity="0.25"
        />
      </svg>
    </div>
  )
}
