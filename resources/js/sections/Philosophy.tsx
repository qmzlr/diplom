import { useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const tags = [
  ['Видеоуроки', '/courses'],
  ['Рекомендации', '/profile'],
  ['Метроном', '/metronome'],
] as const

export default function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const text = textRef.current
    const tagsEl = tagsRef.current
    if (!section || !text || !tagsEl) return
    if (window.matchMedia('(max-width: 700px)').matches) return

    const ctx = gsap.context(() => {
      gsap.from(text, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true,
        },
      })

      gsap.from(tagsEl.children, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 65%',
          once: true,
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="philosophy-section"
      style={{
        backgroundColor: '#ffffff',
        padding: 'clamp(96px, 12vw, 170px) clamp(20px, 4vw, 60px)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '80px',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <p
          ref={textRef}
          style={{
            flex: '1 1 700px',
            fontSize: 'clamp(28px, 4vw, 60px)',
            fontWeight: 400,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: '#000000',
            maxWidth: '1200px',
          }}
        >
          Музыкальное обучение — это не только уроки, но и ежедневная практика,
          вдохновение и личный прогресс.
        </p>

        <div
          ref={tagsRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '12px',
          }}
        >
          {tags.map(([tag, href]) => (
            <button
              key={tag}
              type="button"
              onClick={() => router.visit(href)}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                color: '#000000',
                padding: '10px 18px',
                border: '1px solid #1a1a1a',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#000000'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
