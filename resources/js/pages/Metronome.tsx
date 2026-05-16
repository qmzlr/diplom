import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react'
import { AppShell, PageHero, SectionTitle } from '@/components/AppShell'

const sizes = ['2/4', '3/4', '4/4', '6/8']
const tempoPresets = [
  ['Разминка', 72, 'Медленный темп для чистой посадки и ровной атаки.'],
  ['Техника', 96, 'Базовый темп для повторения упражнений без спешки.'],
  ['Песня', 118, 'Рабочая скорость для куплета, боя или простого groove.'],
  ['Контроль', 144, 'Проверка устойчивости после нескольких чистых повторов.'],
]

const practiceSteps = [
  'Выберите размер и запустите метроном на 10-15 BPM медленнее нужного темпа.',
  'Сыграйте четыре ровных такта, следя за сильной долей и дыханием.',
  'Повышайте BPM только после трёх чистых повторов подряд.',
]

export default function Metronome() {
  const [bpm, setBpm] = useState(96)
  const [bpmInput, setBpmInput] = useState('96')
  const [running, setRunning] = useState(false)
  const [size, setSize] = useState('4/4')
  const [beat, setBeat] = useState(0)
  const audioRef = useRef<AudioContext | null>(null)

  const beatsPerBar = useMemo(() => Number(size.split('/')[0]), [size])

  useEffect(() => {
    if (!running) return

    const interval = window.setInterval(() => {
      setBeat((value) => {
        const next = (value + 1) % beatsPerBar
        playClick(next === 0, audioRef)
        return next
      })
    }, 60000 / bpm)

    return () => window.clearInterval(interval)
  }, [beatsPerBar, bpm, running])

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new AudioContext()
    }
    setRunning((value) => !value)
  }

  const updateBpm = (value: number) => {
    const next = Math.max(40, Math.min(220, Math.round(value)))
    setBpm(next)
    setBpmInput(String(next))
    setBeat(0)
  }

  const commitBpmInput = () => {
    const parsed = Number(bpmInput)
    if (!Number.isFinite(parsed)) {
      setBpmInput(String(bpm))
      return
    }
    updateBpm(parsed)
  }

  return (
    <AppShell>
      <PageHero
        eyebrow="Практика ритма"
        title="Метроном"
        text="Выберите темп и размер, включите сильную долю и используйте метроном во время упражнений."
        image="/images/course-drums.jpg"
      />
      <section className="pn-section metronome-section">
        <div className="pn-container metronome-grid">
          <div
            className={`metronome-panel metronome-stage-panel ${running ? 'is-running' : ''}`}
            style={{ '--beat-duration': `${60000 / bpm}ms` } as CSSProperties}
          >
            <div className="metronome-visual" aria-hidden="true">
              <div className="metronome-ring">
                <div className="metronome-sweep" />
                <div className="metronome-pulse" />
              </div>
              <div className="metronome-beat-track" style={{ gridTemplateColumns: `repeat(${beatsPerBar}, 1fr)` }}>
                {Array.from({ length: beatsPerBar }).map((_, index) => (
                  <i key={index} className={beat === index && running ? 'is-active' : ''} />
                ))}
              </div>
            </div>
            <div className="pn-meta">Текущий темп</div>
            <strong>{bpm}</strong>
            <span>BPM</span>
            <div className="metronome-controls">
              <button className="pn-button" onClick={() => updateBpm(bpm - 5)}><Minus size={16} /></button>
              <label className="metronome-bpm-field">
                <input
                  value={bpmInput}
                  type="number"
                  min={40}
                  max={220}
                  step={1}
                  inputMode="numeric"
                  aria-label="Темп метронома BPM"
                  onChange={(event) => setBpmInput(event.target.value)}
                  onBlur={commitBpmInput}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }
                  }}
                />
                <span>BPM</span>
              </label>
              <button className="pn-button is-dark" onClick={toggle}>{running ? <Pause size={18} /> : <Play size={18} />}</button>
              <button className="pn-button" onClick={() => updateBpm(bpm + 5)}><Plus size={16} /></button>
              <button className="pn-button" onClick={() => { updateBpm(96); setRunning(false) }}><RotateCcw size={16} /></button>
            </div>
          </div>
          <div>
            <SectionTitle title="Размер" aside={size} />
            <div className="meter-buttons">
              {sizes.map((item) => (
                <button className={`pn-button ${size === item ? 'is-dark' : ''}`} key={item} onClick={() => { setSize(item); setBeat(0) }}>
                  {item}
                </button>
              ))}
            </div>
            <div className="beat-row beat-row-large" style={{ gridTemplateColumns: `repeat(${beatsPerBar}, minmax(0, 1fr))` }}>
              {Array.from({ length: beatsPerBar }).map((_, index) => (
                <span key={index} className={beat === index && running ? 'is-active' : ''}>{index + 1}</span>
              ))}
            </div>
            <p className="pn-text">
              Начните медленно, включите сильную долю и повышайте темп только после чистого повторения упражнения несколько раз подряд.
            </p>
          </div>
        </div>
        <div className="pn-container metronome-support">
          <SectionTitle title="Практические режимы" aside="Быстрый старт" />
          <div className="metronome-support-grid">
            {tempoPresets.map(([label, value, text]) => (
              <button
                className="pn-card pn-card-body metronome-preset"
                key={label}
                onClick={() => {
                  updateBpm(Number(value))
                }}
              >
                <div className="pn-meta">{label}</div>
                <span>
                  <strong>{value}</strong>
                  <em>BPM</em>
                </span>
                <p className="pn-text">{text}</p>
              </button>
            ))}
          </div>
          <div className="pn-card pn-card-body metronome-practice">
            <div>
              <div className="pn-meta">Как заниматься</div>
              <h3 className="pn-title">Короткая схема практики</h3>
            </div>
            <ol>
              {practiceSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function playClick(accent: boolean, ref: React.MutableRefObject<AudioContext | null>) {
  const context = ref.current
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = accent ? 1100 : 760
  gain.gain.value = 0.05
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.045)
}
