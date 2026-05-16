import Header from '@/sections/Header'
import { PlayNoteFooter } from '@/components/PlayNoteFooter'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname
  const isAuthPage = ['/login', '/register'].includes(pathname)

  return (
    <div className="pn-shell">
      <Header forceLight={isAuthPage} />
      <main className="pn-main">{children}</main>
      <PlayNoteFooter />
    </div>
  )
}

export function PageHero({
  eyebrow,
  title,
  text,
  image,
}: {
  eyebrow: string
  title: string
  text: string
  image?: string
}) {
  return (
    <section className="pn-page-hero">
      {image && <img src={image} alt="" />}
      <div className="pn-page-hero__overlay" />
      <div className="pn-page-hero__content">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{text}</span>
      </div>
    </section>
  )
}

export function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="pn-section-title">
      <h2>{title}</h2>
      {aside && <span>{aside}</span>}
    </div>
  )
}

export function ProgressLine({ value }: { value: number }) {
  return (
    <div className="pn-progress" aria-label={`Прогресс ${value}%`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
