interface Footer7Props {
  logo?: {
    url: string
    src?: string
    alt: string
    title: string
  }
  sections?: Array<{
    title: string
    links: Array<{ name: string; href: string }>
  }>
  description?: string
  copyright?: string
  legalLinks?: Array<{
    name: string
    href: string
  }>
}

const defaultSections = [
  {
    title: 'Product',
    links: [
      { name: 'Overview', href: '#' },
      { name: 'Pricing', href: '#' },
      { name: 'Marketplace', href: '#' },
      { name: 'Features', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About', href: '#' },
      { name: 'Team', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Help', href: '#' },
      { name: 'Sales', href: '#' },
      { name: 'Advertise', href: '#' },
      { name: 'Privacy', href: '#' },
    ],
  },
]

const defaultLegalLinks = [
  { name: 'Terms and Conditions', href: '#' },
  { name: 'Privacy Policy', href: '#' },
]

export const Footer7 = ({
  logo = {
    url: '/',
    alt: 'PlayNote',
    title: 'PLAYNOTE',
  },
  sections = defaultSections,
  description = 'Курсы, видеоуроки, прогресс, рекомендации, сообщество и метроном в одной системе.',
  copyright = '© 2026 PlayNote. Все права защищены.',
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            <a href={logo.url} aria-label={logo.title} className="flex items-center gap-2 lg:justify-start">
                {logo.src && (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    title={logo.title}
                    className="h-8"
                  />
                )}
              <h2 className="text-xl font-semibold tracking-[0.22em]">{logo.title}</h2>
            </a>
            <p className="max-w-[70%] text-sm text-muted-foreground">
              {description}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {copyright}
            </p>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link.name} className="font-medium hover:text-primary">
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {legalLinks.length > 0 && (
          <div className="mt-8 flex flex-col justify-between gap-4 border-t py-8 text-xs font-medium text-muted-foreground md:flex-row md:items-center md:text-left">
            <ul className="flex flex-col gap-2 md:flex-row">
              {legalLinks.map((link) => (
                <li key={link.name} className="hover:text-primary">
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
