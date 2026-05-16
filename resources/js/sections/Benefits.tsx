import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const benefits = [
  {
    title: 'Учись в удобное время',
    desc: 'Короткие видеоуроки доступны 24/7. Занимайтесь утром, днём или ночью — в своём темпе.',
  },
  {
    title: 'Следи за прогрессом',
    desc: 'Визуальная статистика практики, пройденные уроки и достижения мотивируют двигаться дальше.',
  },
  {
    title: 'Персональные рекомендации',
    desc: 'Платформа анализирует ваш уровень и предлагает курсы, которые подойдут именно вам.',
  },
  {
    title: 'Практикуйся с метрономом',
    desc: 'Встроенный метроном с визуальными маркерами помогает выработать идеальный ритм.',
  },
]

export default function Benefits() {
  const sectionRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const items = itemsRef.current
    if (!section || !items) return

    const ctx = gsap.context(() => {
      gsap.from(items.children, {
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true,
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="benefits-section"
      style={{
        backgroundColor: '#f7f4ef',
        padding: '120px clamp(20px, 4vw, 60px)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            marginBottom: '60px',
            borderBottom: '1px solid #1a1a1a',
            paddingBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: '#000000',
            }}
          >
            Почему PlayNote
          </h2>
        </div>

        <div
          ref={itemsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '40px',
          }}
        >
          {benefits.map((b, i) => (
            <div key={b.title} className="benefit-item">
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  color: '#666666',
                  fontVariantNumeric: 'tabular-nums',
                  display: 'block',
                  marginBottom: '16px',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3
                style={{
                  fontSize: 'clamp(20px, 2vw, 28px)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  color: '#000000',
                  marginBottom: '12px',
                }}
              >
                {b.title}
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: '#666666',
                }}
              >
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
