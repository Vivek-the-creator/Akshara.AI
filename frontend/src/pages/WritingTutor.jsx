import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { aiService } from '../services/aiService'
import './WritingTutor.css'

const LANGUAGES = ['Tamil', 'Telugu', 'Hindi']
const TAMIL_LETTERS = ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ']

const ANALYSIS_STEPS = [
  { id: 1, label: 'Uploading image…',       icon: '📤', duration: 600  },
  { id: 2, label: 'Scanning pixels…',       icon: '🔬', duration: 900  },
  { id: 3, label: 'AI letter detection…',   icon: '🧠', duration: 1100 },
  { id: 4, label: 'Scoring accuracy…',      icon: '📊', duration: 700  },
  { id: 5, label: 'Generating feedback…',   icon: '✏️', duration: 500  },
]

/* ── animated score ring ── */
function ScoreRing({ score, size = 110, stroke = 9 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [dash, setDash] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDash((score / 100) * circ), 300)
    return () => clearTimeout(t)
  }, [score, circ])

  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#FFB84D' : '#f87171'
  const label = score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Trying!'

  return (
    <div className="wt-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(17,24,39,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="wt-ring-inner">
        <span className="wt-ring-score" style={{ color }}>{score}</span>
        <span className="wt-ring-label" style={{ color }}>{label}</span>
      </div>
    </div>
  )
}

export default function WritingTutor() {
  const navigate = useNavigate()
  
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [language, setLanguage] = useState('Tamil')
  const [stage, setStage] = useState('beginner')
  const [letter, setLetter] = useState('அ')
  const [dragOver, setDragOver] = useState(false)

  const [phase, setPhase] = useState('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  const fileRef = useRef(null)
  const resultRef = useRef(null)

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) acceptFile(f)
  }, [])

  const acceptFile = (f) => {
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Max file size is 10MB')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setPhase('idle')
    setErrorMsg('')
  }

  const analyse = async () => {
    if (!file) return
    setPhase('analyzing')
    setStepIdx(0)
    setResult(null)

    let delay = 0
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      delay += i === 0 ? 0 : ANALYSIS_STEPS[i - 1].duration
      setTimeout(() => setStepIdx(i), delay)
    }

    try {
      const data = await aiService.evaluateHandwriting(file, language, stage, 1, letter)
      const ev = data.evaluation ?? data

      const score = Math.round(ev.confidence ?? ev.confidence_score ?? 0)
      setTimeout(() => {
        setResult({ ...ev, score })
        setHistory(h => [...h.slice(-9), score])
        setPhase('result')
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }, delay + ANALYSIS_STEPS[ANALYSIS_STEPS.length - 1].duration)

    } catch (err) {
      setTimeout(() => {
        setErrorMsg(err?.detail || err?.message || 'Analysis failed. Please try again.')
        setPhase('error')
      }, delay)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setPhase('idle')
    setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Layout>
      <div className="writing-tutor">
        <h1 className="page-title">AI Writing Lab</h1>
        <p className="page-subtitle">Upload your handwriting · Get instant AI analysis</p>

        <div className="tutor-grid">
          {/* Upload Panel */}
          <div className="glass-card upload-card">
            <p className="card-label">📤 Upload Handwriting</p>

            <div
              className={`dropzone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !preview && fileRef.current?.click()}
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" className="preview-img" />
                  <button className="clear-btn" onClick={(e) => { e.stopPropagation(); reset() }}>✕</button>
                </>
              ) : (
                <div className="drop-content">
                  <div className="drop-icon">📄</div>
                  <p className="drop-title">Drop image here</p>
                  <p className="drop-hint">or click to browse · JPG/PNG · max 10MB</p>
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden-input"
              onChange={e => e.target.files[0] && acceptFile(e.target.files[0])} />

            <div className="settings-group">
              <div className="field">
                <label className="field-label">Language</label>
                <div className="segmented">
                  {LANGUAGES.map(l => (
                    <button key={l}
                      className={`seg-btn ${language === l ? 'seg-active' : ''}`}
                      onClick={() => setLanguage(l)}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Stage</label>
                <div className="segmented">
                  {['beginner', 'intermediate', 'pro'].map(s => (
                    <button key={s}
                      className={`seg-btn ${stage === s ? 'seg-active' : ''}`}
                      onClick={() => setStage(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Expected Letter</label>
                <div className="letter-grid">
                  {TAMIL_LETTERS.map(l => (
                    <button key={l}
                      className={`letter-btn ${letter === l ? 'letter-active' : ''}`}
                      onClick={() => setLetter(l)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className={`btn-premium btn-primary analyze-btn ${!file || phase === 'analyzing' ? 'disabled' : ''}`}
              onClick={analyse}
              disabled={!file || phase === 'analyzing'}
            >
              {phase === 'analyzing' ? (
                <><span className="spinner" /> Analysing…</>
              ) : (
                <>🧠 Analyse Writing</>
              )}
            </button>
          </div>

          {/* Target Letter */}
          <div className="glass-card target-card">
            <p className="card-label">🎯 Target Letter</p>
            <div className="target-letter">{letter}</div>
            <p className="target-lang">{language} · {stage}</p>
          </div>
        </div>

        {/* Results Section */}
        {phase === 'result' && result && (
          <div className="results-section" ref={resultRef}>
            <div className="glass-card score-card">
              <p className="card-label">🏆 Writing Score</p>
              <div className="score-row">
                <ScoreRing score={result.score} />
                <div className="score-details">
                  <div className="score-stat">
                    <span className="stat-icon">🎯</span>
                    <div>
                      <p className="stat-val">{result.score}%</p>
                      <p className="stat-lbl">Accuracy</p>
                    </div>
                  </div>
                  <div className="score-stat">
                    <span className="stat-icon">{result.is_correct ? '✅' : '❌'}</span>
                    <div>
                      <p className="stat-val">{result.is_correct ? 'Correct' : 'Needs Work'}</p>
                      <p className="stat-lbl">Letter Match</p>
                    </div>
                  </div>
                  <div className="score-stat">
                    <span className="stat-icon">{result.can_proceed ? '🚀' : '🔄'}</span>
                    <div>
                      <p className="stat-val">{result.can_proceed ? 'Next Level!' : 'Retry'}</p>
                      <p className="stat-lbl">Status</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="accuracy-bar">
                <p className="acc-label">Letter Accuracy</p>
                <div className="acc-track">
                  <div className="acc-fill" style={{ width: `${result.score}%` }} />
                  <span className="acc-pct">{result.score}%</span>
                </div>
              </div>
            </div>

            {/* AI Feedback */}
            <div className="glass-card feedback-card">
              <p className="card-label">🤖 AI Feedback</p>
              <div className="feedback-bubble">
                <div className="feedback-avatar">🤖</div>
                <p className="feedback-text">{result.feedback || 'Great effort! Keep practising.'}</p>
              </div>

              {result.improvements?.length > 0 && (
                <div className="suggestions-list">
                  <p className="suggestions-title">💡 Suggestions to Improve</p>
                  {result.improvements.map((tip, i) => (
                    <div key={i} className="suggestion-item">
                      <span className="suggestion-num">{i + 1}</span>
                      <p className="suggestion-text">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="glass-card error-card">
            <span className="error-icon">⚠️</span>
            <p className="error-msg">{errorMsg}</p>
            <button className="retry-btn" onClick={() => setPhase('idle')}>Try Again</button>
          </div>
        )}
      </div>
    </Layout>
  )
}