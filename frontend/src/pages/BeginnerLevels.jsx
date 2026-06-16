import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { progressService } from '../services/progressService'
import audioService from '../utils/audioUtils'
import './BeginnerLevels.css'

const UYIR = [
  { letter: 'அ', rom: 'ah',  level: 1  },
  { letter: 'ஆ', rom: 'aa',  level: 2  },
  { letter: 'இ', rom: 'i',   level: 3  },
  { letter: 'ஈ', rom: 'ii',  level: 4  },
  { letter: 'உ', rom: 'u',   level: 5  },
  { letter: 'ஊ', rom: 'uu',  level: 6  },
  { letter: 'எ', rom: 'e',   level: 7  },
  { letter: 'ஏ', rom: 'ee',  level: 8  },
  { letter: 'ஐ', rom: 'ai',  level: 9  },
  { letter: 'ஒ', rom: 'o',   level: 10 },
  { letter: 'ஓ', rom: 'oo',  level: 11 },
  { letter: 'ஔ', rom: 'au',  level: 12 },
]

/* alternating offsets for a winding path */
const OFFSETS = [0, 120, 220, 120, 0, -120, -220, -120, 0, 120, 220, 120]

const CREATURES = ['🐓','🐇','🦋','🐢','🦎','🐿️','🦜','🐝','🌺','🍄','🦔','⭐']

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  delay: Math.random() * 6, duration: Math.random() * 5 + 4,
}))

export default function BeginnerLevels() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const [progress,      setProgress]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [audioLoading,  setAudioLoading]  = useState(null)
  const [mounted,       setMounted]       = useState(false)
  const [celebrating,   setCelebrating]   = useState(null)

  useEffect(() => {
    setMounted(true)
    if (!user?.id) { setLoading(false); return }
    progressService.getUserProgress('beginner', 'uyir-ezhuthugal')
      .then(d => setProgress(d))
      .catch(() => setProgress([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const isCompleted = (lvl) => progress.find(p => p.level_number === lvl)?.completed_at ?? false
  const isUnlocked  = (lvl) => lvl === 1 || isCompleted(lvl - 1)
  const getStars    = (lvl) => progress.find(p => p.level_number === lvl)?.stars_awarded ?? 0

  const completedCount = UYIR.filter(l => isCompleted(l.level)).length
  const totalStars     = progress.reduce((s, p) => s + (p.stars_awarded || 0), 0)

  const handleClick = (item) => {
    if (!isUnlocked(item.level)) return
    setCelebrating(item.level)
    setTimeout(() => {
      setCelebrating(null)
      navigate(`/practice/beginner/uyir-ezhuthugal/${item.level}`)
    }, 400)
  }

  const playAudio = async (letter, e) => {
    e.stopPropagation()
    try {
      if (!audioService.isSupported()) return
      setAudioLoading(letter)
      await audioService.pronounceLetter(letter, user?.learning_language || 'Tamil')
    } catch (_) {}
    finally { setAudioLoading(null) }
  }

  return (
    <div className="bl-root">
      {/* background */}
      <div className="bl-bg-village" />
      {PARTICLES.map(p => (
        <span key={p.id} className="bl-particle" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }} />
      ))}

      {/* header */}
      <div className="bl-header">
        <button className="bl-back" onClick={() => navigate('/levels')}>← Worlds</button>

        <div className="bl-title-block">
          <span className="bl-world-badge">🏘️ Village</span>
          <h1 className="bl-title">உயிர் எழுத்துக்கள்</h1>
          <p className="bl-title-sub">Tamil Vowels · Uyir Ezhuthugal</p>
        </div>

        <div className="bl-stats">
          <div className="bl-stat">
            <span className="bl-stat-val">{completedCount}/12</span>
            <span className="bl-stat-lbl">Lessons</span>
          </div>
          <div className="bl-stat-divider" />
          <div className="bl-stat">
            <span className="bl-stat-val">⭐ {totalStars}</span>
            <span className="bl-stat-lbl">Stars</span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="bl-progress-wrap">
        <div className="bl-progress-track">
          <div className="bl-progress-fill" style={{ width: mounted ? `${(completedCount / 12) * 100}%` : '0%' }} />
        </div>
        <span className="bl-progress-pct">{Math.round((completedCount / 12) * 100)}%</span>
      </div>

      {/* lesson path */}
      {loading ? (
        <div className="bl-loading">
          {[1,2,3].map(i => <div key={i} className="bl-skel" style={{ animationDelay: `${i*0.15}s` }} />)}
        </div>
      ) : (
        <div className={`bl-path ${mounted ? 'bl-mounted' : ''}`}>
          {UYIR.map((item, idx) => {
            const done      = isCompleted(item.level)
            const unlocked  = isUnlocked(item.level)
            const active    = unlocked && !done
            const stars     = getStars(item.level)
            const offset    = OFFSETS[idx]
            const isCurrent = active && UYIR.filter(l => isCompleted(l.level)).length === idx

            return (
              <div
                key={item.level}
                className="bl-node-row"
                style={{ '--offset': `${offset}px`, animationDelay: `${idx * 0.07}s` }}
              >
                {/* connector */}
                {idx > 0 && (
                  <div className={`bl-connector ${isCompleted(item.level - 1) ? 'bl-conn-done' : ''}`} />
                )}

                {/* node */}
                <div
                  className={`bl-node ${done ? 'bl-node-done' : ''} ${isCurrent ? 'bl-node-current' : ''} ${!unlocked ? 'bl-node-locked' : ''} ${celebrating === item.level ? 'bl-node-celebrate' : ''}`}
                  onClick={() => handleClick(item)}
                >
                  {/* glow rings */}
                  {isCurrent && <div className="bl-node-ring" />}
                  {isCurrent && <div className="bl-node-ring bl-ring-2" />}
                  {done && <div className="bl-gold-glow" />}

                  {/* creature badge */}
                  {unlocked && (
                    <div className="bl-creature">{CREATURES[idx]}</div>
                  )}

                  {/* node face */}
                  <div className="bl-node-face">
                    {!unlocked ? (
                      <span className="bl-lock">🔮</span>
                    ) : (
                      <span className="bl-letter">{item.letter}</span>
                    )}
                  </div>

                  {/* stars row */}
                  <div className="bl-stars">
                    {[1,2,3].map(s => (
                      <span key={s} className={`bl-star ${s <= stars ? 'bl-star-lit' : ''}`}>★</span>
                    ))}
                  </div>

                  {/* level number */}
                  <div className="bl-lvl-badge">{item.level}</div>
                </div>

                {/* info panel beside node */}
                <div className={`bl-node-info ${offset >= 0 ? 'bl-info-right' : 'bl-info-left'}`}>
                  <p className="bl-rom">{item.rom}</p>
                  {unlocked && (
                    <button
                      className="bl-sound-btn"
                      onClick={(e) => playAudio(item.letter, e)}
                      disabled={audioLoading === item.letter}
                    >
                      {audioLoading === item.letter ? '⏳' : '🔊'}
                    </button>
                  )}
                  <p className="bl-status">
                    {done ? '✅ Done' : unlocked ? (isCurrent ? '▶ Play' : '🔓 Open') : '🔮 Locked'}
                  </p>
                </div>
              </div>
            )
          })}

          {/* finish star */}
          <div className="bl-finish">
            <div className={`bl-finish-star ${completedCount === 12 ? 'bl-finish-lit' : ''}`}>🌟</div>
            <p className="bl-finish-label">{completedCount === 12 ? 'Master!' : 'Finish'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
