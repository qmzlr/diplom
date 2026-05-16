import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import Header from './sections/Header'
import Hero from './sections/Hero'
import Philosophy from './sections/Philosophy'
import Works from './sections/Works'
import Capabilities from './sections/Capabilities'
import Spatial from './sections/Spatial'
import { PlayNoteFooter } from './components/PlayNoteFooter'
import Preloader from './sections/Preloader'
import Benefits from './sections/Benefits'
import type { Course } from './data/courses'

export default function App({ courses = [] }: { courses?: Course[] }) {
  const scrollRef = useRef({ y: 0, speed: 0 })
  const [currentCourseId] = useState<string | null>(null)

  useEffect(() => {
    let rafId: number
    let prevY = window.scrollY

    const tick = () => {
      const y = window.scrollY
      const delta = y - prevY
      scrollRef.current.y = y
      scrollRef.current.speed = delta
      prevY = y
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [])

  const handleSelectCourse = (id: string) => router.visit(`/courses/${id}`)

  return (
    <>
      <Preloader />
      <Header scrollRef={scrollRef} forceLight={currentCourseId !== null} />
      <main>
        <Spatial />
        <Philosophy />
        <Works courses={courses} onSelectCourse={handleSelectCourse} />
        <Capabilities />
        <Benefits />
        <Hero />
      </main>
      <PlayNoteFooter />
    </>
  )
}
