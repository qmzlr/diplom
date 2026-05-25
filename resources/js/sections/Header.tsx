import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  scrollRef?: React.MutableRefObject<{ y: number; speed: number }>
  forceLight?: boolean
}

const navItems = [
  { label: 'Курсы', target: '/courses' },
  { label: 'Инструменты', target: '/instruments' },
  { label: 'Метроном', target: '/metronome' },
  { label: 'Профиль', target: '/profile' },
  { label: 'Сообщество', target: '/community' },
]

export default function Header({ forceLight = false }: HeaderProps) {
  const [overHeroRaw, setOverHeroRaw] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const check = () => {
      const firstSection = document.querySelector('main > section:first-child')
      const isHeroSection =
        firstSection?.classList.contains('spatial-hero') ||
        firstSection?.classList.contains('pn-page-hero')
      const firstSectionBottom = firstSection?.getBoundingClientRect().bottom ?? 0

      setOverHeroRaw(Boolean(isHeroSection && firstSectionBottom > 78))
      rafRef.current = requestAnimationFrame(check)
    }
    rafRef.current = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [menuOpen])

  const overHero = overHeroRaw && !forceLight
  const { user, isAuthenticated } = useAuth({ redirectPath: '/' })
  const visibleNavItems = [
    ...navItems,
    ...(user?.role === 'teacher' ? [{ label: 'Учителю', target: '/teacher' }] : []),
    ...(user?.role === 'moderator' ? [{ label: 'Модерация', target: '/moderator' }] : []),
    ...(user?.role === 'admin' ? [{ label: 'Админ', target: '/admin' }] : []),
  ]

  const handleNavClick = (targetId: string) => {
    if (targetId.startsWith('/')) {
      router.visit(targetId)
      setMenuOpen(false)
      return
    }

    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      setMenuOpen(false)
    }
  }

  const handleLogoClick = () => {
    setMenuOpen(false)
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    router.visit('/')
  }

  const textColor = overHero ? '#ffffff' : '#000000'

  return (
    <header
      className="site-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '74px',
        backgroundColor: overHero ? 'rgba(6,6,6,0.18)' : 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(18px)',
        borderBottom: overHero
          ? '1px solid rgba(255,255,255,0.18)'
          : '1px solid #000000',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(20px, 4vw, 60px)',
        transition:
          'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="site-header__inner">
        <div
          className="site-brand"
          style={{
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            cursor: 'pointer',
            color: textColor,
            transition: 'color 0.4s ease',
          }}
          onClick={handleLogoClick}
        >
          PLAYNOTE
        </div>

        <button
          className="nav-toggle"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((value) => !value)}
          style={{
            color: textColor,
            border: `1px solid ${overHero ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)'}`,
            backgroundColor: 'transparent',
          }}
        >
          {menuOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
        </button>

        <nav
          className={`site-nav ${menuOpen ? 'is-open' : ''}`}
          style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}
        >
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              overHero={overHero}
              onClick={() => handleNavClick(item.target)}
            />
          ))}
          {!isAuthenticated && (
            <NavItem
              label="Войти"
              overHero={overHero}
              onClick={() => {
                setMenuOpen(false)
                router.visit('/login')
              }}
            />
          )}
        </nav>
      </div>
    </header>
  )
}

function NavItem({
  label,
  overHero,
  onClick,
}: {
  label: string
  overHero: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  const baseColor = overHero ? '#ffffff' : '#000000'
  const hoverBg = overHero ? '#ffffff' : '#000000'
  const hoverFg = overHero ? '#000000' : '#ffffff'

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 22px',
        fontSize: '13px',
        fontWeight: 400,
        letterSpacing: '0.06em',
        backgroundColor: hovered ? hoverBg : 'transparent',
        color: hovered ? hoverFg : baseColor,
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.25s ease, color 0.25s ease',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--pn-font-main)',
      }}
    >
      {label}
    </button>
  )
}
