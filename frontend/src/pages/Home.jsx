import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Home.css'

const FEATURES = [
  { icon: '🤖', title: 'AI Writing Tutor', desc: 'Smart letter recognition', color: '#7B61FF' },
  { icon: '🎤', title: 'Speech Practice', desc: 'Pronunciation mastery', color: '#5AA8FF' },
  { icon: '🎮', title: 'Interactive Lessons', desc: 'Gamified learning paths', color: '#FFB84D' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Your growth journey', color: '#4ADE80' },
]

const FLOATING_LETTERS = [
  { char: 'அ', lang: 'tamil', x: 15, y: 20, size: 3 },
  { char: 'க', lang: 'tamil', x: 85, y: 15, size: 2.5 },
  { char: 'ஷ', lang: 'tamil', x: 25, y: 75, size: 2.8 },
  { char: 'ர', lang: 'tamil', x: 75, y: 65, size: 2.2 },
  { char: 'A', lang: 'english', x: 20, y: 10, size: 3.2 },
  { char: 'Z', lang: 'english', x: 70, y: 80, size: 2.4 },
  { char: 'अ', lang: 'hindi', x: 50, y: 25, size: 2.6 },
  { char: 'क', lang: 'hindi', x: 35, y: 60, size: 2 },
]

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 2,
  delay: Math.random() * 5,
  duration: Math.random() * 6 + 6,
}))

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const mascotRef = useRef(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const onMove = (e) => {
      if (!mascotRef.current) return
      const rect = mascotRef.current.getBoundingClientRect()
      setMouse({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 30,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 30,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className={`home-root ${visible ? 'home-visible' : ''}`}>
      {/* ── Hero Section ── */}
      <section className="hero" ref={mascotRef}>
        {/* Aurora Background */}
        <div className="hero-aurora" />

        {/* Stars */}
        <div className="stars" />

        {/* Particles */}
        {PARTICLES.map(p => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: `${p.size}px`, height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}

        {/* Floating Letters */}
        <div className="floating-letters">
          {FLOATING_LETTERS.map((l, i) => (
            <span
              key={i}
              className={`fl-item fl-${l.lang}`}
              style={{
                left: `${l.x}%`, top: `${l.y}%`,
                fontSize: `${l.size}rem`,
                transform: `translate(${mouse.x * 0.5}px, ${mouse.y * 0.5}px)`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {l.char}
            </span>
          ))}
        </div>

        {/* Mascot Area */}
        <div className="mascot-area" style={{ transform: `translate(${mouse.x * 0.2}px, ${mouse.y * 0.2}px)` }}>
          <div className="mascot-glow" />
          <div className="mascot">🤖</div>
          <div className="mascot-ring-1" />
          <div className="mascot-ring-2" />
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <h1 className="hero-headline">
            Where Learning<br />
            <span className="gradient-text">Becomes an Adventure</span>
          </h1>
          <p className="hero-sub">
            AI-powered native language learning platform<br />
            for children. Learn reading, writing,<br />
            pronunciation, and vocabulary<br />
            through interactive adventures.
          </p>
          <div className="hero-buttons">
            <button className="btn-premium btn-primary" onClick={() => navigate(user ? '/dashboard' : '/login')}>
              🚀 Start Learning
            </button>
            <button className="btn-premium btn-secondary">
              ▶ Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features-section">
        <h2 className="section-title">Explore the Universe</h2>
        <div className="features-grid grid-24 grid-24-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="feature-card glass-card"
              style={{ '--accent': f.color }}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}