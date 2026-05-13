import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion'
import FlipCard from '../components/FlipCard'

/* ─── Data ─────────────────────────────────────────────── */
const FLIP_CARDS = [
  {
    icon: '🌲',
    frontTitle: 'Random Forest Algorithm',
    frontText:
      'The primary ML model uses Random Forest — an ensemble of 500 decision trees — to classify accident severity based on weather, road, vehicle, and time factors.',
    backTitle: 'Why Random Forest?',
    backPoints: [
      'Handles non-linear relationships between features',
      'Identifies most important accident risk factors',
      'Robust to outliers and missing values',
      'Works well on large, imbalanced datasets',
      'Feature importance gives interpretability',
    ],
  },
  {
    icon: '📊',
    frontTitle: 'Model Accuracy: 88–92%',
    frontText:
      'After training and testing on historical accident data, the Random Forest model achieved 88–92% accuracy — correctly classifying ~9 out of 10 accident cases.',
    backTitle: 'Ensemble Performance',
    backContent:
      'The system combines Random Forest + XGBoost + Neural Network via soft-voting ensemble, achieving up to 91.8% accuracy with a macro F1 score of 0.902.',
    highlight: '91.8%',
  },
  {
    icon: '⚠️',
    frontTitle: 'Accident Cause Factors',
    frontText:
      'Road accidents result from a combination of human behaviour, environmental conditions, road infrastructure issues, and vehicle-related factors.',
    backTitle: 'Key Risk Factors',
    backPoints: [
      'Driver: over-speeding, drunk driving, fatigue',
      'Environment: fog, ice, wet roads, poor visibility',
      'Infrastructure: potholes, poor lighting, no signals',
      'Vehicle: brake failure, tyre bursts, poor maintenance',
      'Time: night driving, peak hour, rural areas',
    ],
  },
]

const STATS = [
  { value: 91.8, suffix: '%', label: 'Ensemble Accuracy', icon: '🎯' },
  { value: 80, suffix: 'K+', label: 'Training Records', icon: '📚' },
  { value: 3, suffix: '', label: 'ML Models', icon: '🤖' },
  { value: 18, suffix: '', label: 'Input Features', icon: '⚙️' },
  { value: 3, suffix: '', label: 'Severity Classes', icon: '🚦' },
]

const AI_STEPS = [
  {
    step: '01',
    title: 'Data Collection',
    desc: 'Real-time ingestion of accident records, weather APIs, and road condition data from Pune city infrastructure.',
    icon: '🗄️',
    color: '#6366f1',
  },
  {
    step: '02',
    title: 'Feature Engineering',
    desc: '18 key risk factors extracted — from time-of-day and weather to road type and vehicle condition.',
    icon: '🔬',
    color: '#0ea5e9',
  },
  {
    step: '03',
    title: 'Ensemble Inference',
    desc: 'Random Forest + XGBoost + Neural Net combine via soft-voting for robust, accurate severity prediction.',
    icon: '🧠',
    color: '#8b5cf6',
  },
  {
    step: '04',
    title: 'Severity Output',
    desc: 'Instant Minor / Serious / Fatal classification with confidence scores and actionable safety recommendations.',
    icon: '🚦',
    color: '#10b981',
  },
]

const INSIGHTS = [
  {
    title: 'Peak Risk Hours',
    value: '8–10 PM',
    detail: 'Nighttime driving has 3× higher fatal severity likelihood',
    icon: '🌙',
    color: '#f59e0b',
  },
  {
    title: 'Weather Impact',
    value: '2.4×',
    detail: 'Fog and rain multiply accident severity probability',
    icon: '🌧️',
    color: '#0ea5e9',
  },
  {
    title: 'High-Risk Zones',
    value: '12 Zones',
    detail: 'Identified critical accident hotspots across Pune',
    icon: '📍',
    color: '#ef4444',
  },
  {
    title: 'Response Time',
    value: '< 200ms',
    detail: 'Real-time prediction latency for emergency dispatch',
    icon: '⚡',
    color: '#10b981',
  },
]

/* ─── Animated Counter ─────────────────────────────────── */
function AnimatedCounter({ target, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = parseFloat(target)
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(parseFloat(start.toFixed(1)))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

/* ─── Typewriter ────────────────────────────────────────── */
function Typewriter({ texts, speed = 80, pause = 2000 }) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[idx]
    let timeout
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed)
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2)
    } else {
      setDeleting(false)
      setIdx(i => (i + 1) % texts.length)
    }
    setDisplayed(current.slice(0, charIdx))
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, idx, texts, speed, pause])

  return (
    <span className="typewriter-text">
      {displayed}
      <span className="typewriter-cursor">|</span>
    </span>
  )
}

/* ─── Floating Particle ─────────────────────────────────── */
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
  }))

  return (
    <div className="particles-container" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ─── Section Wrapper ───────────────────────────────────── */
function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Home() {
  return (
    <main className="home-page">
      <FloatingParticles />

      {/* Ambient blobs */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="home-hero" style={{ paddingTop: '5rem' }}>
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-dot" />
          B.E. Final Year Project — AI/ML + MERN
        </motion.div>

        <motion.h1
          className="hero-heading"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Road Accident<br />
          <span className="hero-heading-gradient">Severity Prediction</span>
        </motion.h1>

        <motion.div
          className="hero-typewriter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Typewriter
            texts={[
              'Powered by Ensemble ML Models',
              'Real-time Risk Classification',
              'Smart Safety Intelligence',
              'AI-Driven Accident Prevention',
            ]}
          />
        </motion.div>

        <motion.p
          className="hero-desc-premium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          A Machine Learning–based system that analyses historical road accident data and predicts
          severity — <strong>Minor, Serious, or Fatal</strong>. Empowering traffic authorities,
          emergency services, and government agencies to take preventive action.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link to="/predict" className="btn-hero-primary">
            <span className="btn-glow" />
            🚀 Try Prediction
          </Link>
          <Link to="/dashboard" className="btn-hero-secondary">
            📊 View Analytics
          </Link>
        </motion.div>

        {/* Floating Dashboard Cards */}
        <motion.div
          className="hero-dashboard-cards"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7 }}
        >
          <motion.div
            className="hero-mini-card"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="mini-card-icon">🎯</span>
            <span className="mini-card-val">91.8%</span>
            <span className="mini-card-lbl">Accuracy</span>
          </motion.div>
          <motion.div
            className="hero-mini-card hero-mini-card--center"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <span className="mini-card-icon">⚡</span>
            <span className="mini-card-val">Real-time</span>
            <span className="mini-card-lbl">Prediction</span>
          </motion.div>
          <motion.div
            className="hero-mini-card"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <span className="mini-card-icon">🤖</span>
            <span className="mini-card-val">3 Models</span>
            <span className="mini-card-lbl">Ensemble</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <RevealSection className="stats-section">
        <div className="premium-stats-bar">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              className="premium-stat-item"
              whileHover={{ scale: 1.06, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="premium-stat-icon">{s.icon}</div>
              <div className="premium-stat-value">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div className="premium-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── System Core Features (Flip Cards) ─────────────── */}
      <RevealSection delay={0.1}>
        <div className="premium-section-heading" style={{ paddingTop: '4rem' }}>
          <span className="section-tag">Core Technology</span>
          <h2>System Core Features</h2>
          <p className="section-sub">Hover the cards to explore our ML pipeline in depth</p>
        </div>
      </RevealSection>

      <div className="flip-cards-grid fade-in" style={{ marginBottom: '2rem' }}>
        {FLIP_CARDS.map((card, i) => (
          <FlipCard key={i} {...card} />
        ))}
      </div>

      {/* ── How AI Prediction Works ───────────────────────── */}
      <RevealSection delay={0.1}>
        <div className="premium-section-heading" style={{ paddingTop: '4rem' }}>
          <span className="section-tag">Under the Hood</span>
          <h2>How AI Prediction Works</h2>
          <p className="section-sub">Four-stage intelligent pipeline from raw data to actionable insight</p>
        </div>
      </RevealSection>

      <RevealSection delay={0.2}>
        <div className="ai-steps-grid">
          {AI_STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="ai-step-card"
              whileHover={{ scale: 1.03, y: -6 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{ '--step-color': step.color }}
            >
              <div className="ai-step-number">{step.step}</div>
              <div className="ai-step-icon">{step.icon}</div>
              <h3 className="ai-step-title">{step.title}</h3>
              <p className="ai-step-desc">{step.desc}</p>
              {i < AI_STEPS.length - 1 && <div className="ai-step-arrow">→</div>}
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── Live Monitoring Dashboard ─────────────────────── */}
      <RevealSection delay={0.1}>
        <div className="premium-section-heading" style={{ paddingTop: '4rem' }}>
          <span className="section-tag">Live System</span>
          <h2>Live Monitoring Dashboard</h2>
          <p className="section-sub">Real-time accident intelligence across Pune's road network</p>
        </div>
      </RevealSection>

      <RevealSection delay={0.2}>
        <div className="live-dashboard-grid">
          {/* Activity feed */}
          <div className="live-feed-card">
            <div className="live-feed-header">
              <span className="live-dot" />
              <span>Live Activity Feed</span>
            </div>
            {[
              { time: '09:02 AM', zone: 'Shivajinagar Rd', severity: 'Minor', color: '#10b981' },
              { time: '08:47 AM', zone: 'FC Road Junction', severity: 'Serious', color: '#f59e0b' },
              { time: '08:31 AM', zone: 'Hadapsar Flyover', severity: 'Fatal', color: '#ef4444' },
              { time: '08:15 AM', zone: 'Kothrud Bypass', severity: 'Minor', color: '#10b981' },
            ].map((ev, i) => (
              <motion.div
                key={i}
                className="feed-event"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feed-time">{ev.time}</div>
                <div className="feed-zone">{ev.zone}</div>
                <div className="feed-severity" style={{ color: ev.color, borderColor: ev.color }}>
                  {ev.severity}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Severity breakdown */}
          <div className="severity-breakdown-card">
            <h3 className="breakdown-title">Severity Breakdown</h3>
            <p className="breakdown-sub">Last 24 hours — Pune Region</p>
            {[
              { label: 'Minor', pct: 62, color: '#10b981' },
              { label: 'Serious', pct: 28, color: '#f59e0b' },
              { label: 'Fatal', pct: 10, color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} className="breakdown-row">
                <div className="breakdown-label">
                  <span className="breakdown-dot" style={{ background: item.color }} />
                  {item.label}
                </div>
                <div className="breakdown-bar-bg">
                  <motion.div
                    className="breakdown-bar-fill"
                    style={{ background: item.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
                    viewport={{ once: true }}
                  />
                </div>
                <span className="breakdown-pct">{item.pct}%</span>
              </div>
            ))}
          </div>

          {/* System health */}
          <div className="system-health-card">
            <h3 className="breakdown-title">System Health</h3>
            {[
              { name: 'ML API', status: 'Online', ok: true },
              { name: 'Database', status: 'Synced', ok: true },
              { name: 'Map Layer', status: 'Live', ok: true },
              { name: 'Alert Engine', status: 'Active', ok: true },
            ].map((sys, i) => (
              <div key={i} className="health-row">
                <span className="health-name">{sys.name}</span>
                <span className={`health-badge ${sys.ok ? 'health-ok' : 'health-err'}`}>
                  <span className="health-blink" />
                  {sys.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── Smart Safety Insights ─────────────────────────── */}
      <RevealSection delay={0.1}>
        <div className="premium-section-heading" style={{ paddingTop: '4rem' }}>
          <span className="section-tag">Intelligence</span>
          <h2>Smart Safety Insights</h2>
          <p className="section-sub">Data-driven patterns discovered by our AI across thousands of accident records</p>
        </div>
      </RevealSection>

      <RevealSection delay={0.2}>
        <div className="insights-grid">
          {INSIGHTS.map((ins, i) => (
            <motion.div
              key={i}
              className="insight-card"
              whileHover={{ scale: 1.04, y: -8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{ '--ins-color': ins.color }}
            >
              <div className="insight-icon-wrap">
                <span className="insight-icon">{ins.icon}</span>
                <div className="insight-glow" />
              </div>
              <div className="insight-title">{ins.title}</div>
              <div className="insight-value">{ins.value}</div>
              <p className="insight-detail">{ins.detail}</p>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── Premium CTA Section ───────────────────────────── */}
      <RevealSection delay={0.1}>
        <div className="premium-cta-section">
          <div className="cta-glow-1" aria-hidden="true" />
          <div className="cta-glow-2" aria-hidden="true" />
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Get Started</span>
            <h2 className="cta-heading">
              Ready to Predict Road Safety?
            </h2>
            <p className="cta-desc">
              Enter real-world accident parameters and get an instant AI-powered severity classification
              with confidence scores and actionable safety recommendations.
            </p>
            <div className="hero-buttons" style={{ justifyContent: 'center', marginTop: '2rem' }}>
              <Link to="/predict" className="btn-hero-primary">
                <span className="btn-glow" />
                🚀 Try Prediction Now
              </Link>
              <Link to="/dashboard" className="btn-hero-secondary">
                📊 Explore Analytics
              </Link>
            </div>
          </motion.div>
        </div>
      </RevealSection>

    </main>
  )
}
