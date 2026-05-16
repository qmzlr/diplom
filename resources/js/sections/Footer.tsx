export default function Footer() {
  return (
    <footer
      id="footer"
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #000000',
        padding: '80px clamp(20px, 4vw, 60px) 0',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Top: columns */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          paddingBottom: '80px',
        }}
      >
        <FooterColumn
          title="КУРСЫ"
          links={['Гитара', 'Фортепиано', 'Барабаны', 'Вокал', 'Укулеле', 'Теория']}
        />
        <FooterColumn
          title="ИНСТРУМЕНТЫ"
          links={['Акустика', 'Электрогитара', 'Клавишные', 'Ударные', 'Струнные']}
        />
        <FooterColumn
          title="ПЛАТФОРМА"
          links={['О нас', 'Блог', 'Партнёры', 'Карьера', 'Помощь']}
        />
        <div>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              color: '#000000',
              marginBottom: '20px',
            }}
          >
            КОНТАКТЫ
          </p>
          <p style={{ fontSize: '14px', color: '#666666', lineHeight: 2 }}>
            hello@playnote.com
            <br />
            +7 (999) 555-01-23
            <br />
            Telegram: @playnote_support
          </p>
        </div>
      </div>

      {/* Bottom: Giant Wordmark */}
      <div
        style={{
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0.85,
          paddingBottom: '0',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 'clamp(80px, 18vw, 320px)',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            color: '#000000',
            whiteSpace: 'nowrap',
            transform: 'translateY(15%)',
            userSelect: 'none',
          }}
        >
          PLAYNOTE
        </span>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p
        style={{
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.18em',
          color: '#000000',
          marginBottom: '20px',
        }}
      >
        {title}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {links.map((link) => (
          <li key={link} style={{ marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '14px',
                color: '#666666',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#000000')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
            >
              {link}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
