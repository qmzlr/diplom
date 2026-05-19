import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { Toaster } from '@/components/ui/sonner'
import './index.css'

createInertiaApp({
  title: (title) => (title ? `${title} - Playnote` : 'Playnote'),
  resolve: async (name) => {
    const pages = import.meta.glob('./pages/**/*.tsx')
    const page = pages[`./pages/${name}.tsx`]

    if (!page) {
      throw new Error(`Страница не найдена: ${name}`)
    }

    return page()
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <App {...props} />
        <Toaster richColors position="top-right" />
      </>,
    )
  },
  progress: {
    color: '#0b0b0b',
  },
})
