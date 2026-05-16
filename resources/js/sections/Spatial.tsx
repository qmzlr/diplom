import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Spatial() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const content = contentRef.current
    if (!section || !content) return
    if (window.matchMedia('(max-width: 700px)').matches) return

    const ctx = gsap.context(() => {
      gsap.from(content.children, {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.4,
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="spatial"
      ref={sectionRef}
      className="spatial-hero"
      style={{
        position: 'relative',
        width: '100%',
        height: '100svh',
        minHeight: '100svh',
        overflow: 'hidden',
        backgroundColor: '#0b0b0b',
      }}
    >
      <video
        src="/videos/capabilities-music.mp4"
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setVideoReady(true)}
        aria-label="Music learning video"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 0.7s ease',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.44) 42%, rgba(0,0,0,0.18) 72%), linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 46%, rgba(0,0,0,0.72) 100%)',
        }}
      />
      <div className="hero-grid-lines" aria-hidden="true" />

      <div
        ref={contentRef}
        className="spatial-content"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          maxWidth: '1560px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          alignItems: 'flex-start',
          justifyContent: 'center',
          alignContent: 'center',
          gap: '24px',
          padding: '0 clamp(32px, 4.5vw, 72px)',
        }}
      >
        <div className="spatial-copy">
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
            }}
          >
            Онлайн-платформа · Обучение музыке
          </span>

          <h1
            style={{
              fontSize: 'clamp(44px, 7vw, 108px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              color: '#ffffff',
              maxWidth: '920px',
              textShadow: '0 2px 24px rgba(0,0,0,0.25)',
              marginTop: '28px',
            }}
          >
            Учись музыке
            <br />
            в своём ритме
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 1.2vw, 18px)',
              fontWeight: 300,
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.88)',
              maxWidth: '520px',
              marginTop: '28px',
            }}
          >
            Онлайн-платформа для изучения музыкальных инструментов через видеоуроки,
            практику, рекомендации и личный прогресс.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button
              onClick={() => document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' })}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                color: hovered ? '#0b0b0b' : '#ffffff',
                backgroundColor: hovered ? '#ffffff' : 'transparent',
                border: '1px solid #ffffff',
                padding: '16px 36px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                fontFamily: 'var(--pn-font-main)',
              }}
            >
              Начать обучение
            </button>
            <button
              onClick={() => document.querySelector('#matching')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                color: '#ffffff',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '16px 8px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontFamily: 'var(--pn-font-main)',
                textDecoration: 'underline',
                textUnderlineOffset: '6px',
              }}
            >
              Подобрать курс →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
