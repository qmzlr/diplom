import { useEffect, useRef, useState } from 'react'

const PRELOADER_SEEN_KEY = 'playnote_preloader_seen'

function shouldShowPreloader() {
  try {
    return window.sessionStorage.getItem(PRELOADER_SEEN_KEY) !== 'true'
  } catch {
    return true
  }
}

export default function Preloader() {
  const [visible, setVisible] = useState(shouldShowPreloader)
  const preloaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return

    try {
      window.sessionStorage.setItem(PRELOADER_SEEN_KEY, 'true')
    } catch {
      // Ignore storage failures; the visual fallback still works.
    }

    const t1 = setTimeout(() => {
      const el = preloaderRef.current
      if (el) {
        el.style.opacity = '0'
        el.style.pointerEvents = 'none'
      }
    }, 1800)

    const t2 = setTimeout(() => setVisible(false), 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      ref={preloaderRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0b0b0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.8s ease',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(24px, 4vw, 48px)',
          fontWeight: 500,
          letterSpacing: '0.28em',
          color: '#ffffff',
          textTransform: 'uppercase',
          animation: 'preloaderPulse 1.6s ease-in-out infinite',
        }}
      >
        PLAYNOTE
      </span>
      <style>{`
        @keyframes preloaderPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
