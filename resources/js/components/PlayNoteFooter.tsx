import { Footer7 } from '@/components/ui/footer-7'

const sections = [
  {
    title: 'Обучение',
    links: [
      { name: 'Курсы', href: '/courses' },
      { name: 'Инструменты', href: '/instruments' },
      { name: 'Метроном', href: '/metronome' },
      { name: 'Рекомендации', href: '/#matching' },
    ],
  },
  {
    title: 'Платформа',
    links: [
      { name: 'Профиль', href: '/profile' },
      { name: 'Сообщество', href: '/community' },
    ],
  },
  {
    title: 'Контакты',
    links: [
      { name: 'hello@playnote.com', href: 'mailto:hello@playnote.com' },
      { name: '+7 (999) 555-01-23', href: 'tel:+79995550123' },
      { name: 'Политика конфиденциальности', href: '/privacy' },
    ],
  },
]

export function PlayNoteFooter() {
  return (
    <footer className="playnote-footer">
      <Footer7
        logo={{ url: '/', alt: 'PlayNote', title: 'PLAYNOTE' }}
        sections={sections}
        description="Курсы, видеоуроки, прогресс, рекомендации, сообщество и метроном в одной системе."
        copyright="© 2026 PlayNote. Учитесь музыке в своём ритме."
        legalLinks={[]}
      />
    </footer>
  )
}
