import { Suspense, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import HaloModel from './HaloModel'

function useProgress(active, onDone) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    if (!active) return
    let p = 0
    const id = setInterval(() => {
      p += Math.random() * 1.5 + 0.5
      if (p >= 100) {
        p = 100
        clearInterval(id)
        setTimeout(onDone, 400)
      }
      setPct(Math.min(Math.round(p), 100))
    }, 120)
    return () => clearInterval(id)
  }, [active, onDone])
  return pct
}

function SceneReady({ onReady }) {
  useEffect(() => { onReady() }, [onReady])
  return null
}

export default function LoadingScreen({ onComplete }) {
  const [visible,    setVisible]    = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [fading,     setFading]     = useState(false)
  const [gone,       setGone]       = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const handleDone = useCallback(() => {
    setFading(true)
    setTimeout(() => { setGone(true); onComplete?.() }, 800)
  }, [onComplete])

  const pct = useProgress(modelReady, handleDone)

  if (gone) return null

  return (
    <div style={{
      ...s.wrap,
      opacity:    fading ? 0 : visible ? 1 : 0,
      transition: `opacity ${fading ? '0.8s' : '0.4s'} ease`,
    }}>

      {/* 3D Canvas — transparent, sits on white page */}
      <Canvas
        style={s.canvas}
        camera={{ fov: 45, position: [0, 0, 5] }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0)
        }}
        shadows
        dpr={[1, 2]}
      >
        {/* Soft even lighting for cartoon colours */}
        <ambientLight intensity={2.5} />
        <directionalLight position={[0, 5, 5]}  intensity={1.0} />
        <directionalLight position={[-4, 2, 2]} intensity={0.6} />
        <directionalLight position={[4, -2, 2]} intensity={0.4} />

        <Suspense fallback={null}>
          <HaloModel />
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.1}
            scale={6}
            blur={3}
            far={3}
            color="#000000"
          />
          <SceneReady onReady={() => setModelReady(true)} />
        </Suspense>
      </Canvas>

      {/* Loading UI */}
      <div style={s.loaderWrap}>
        <p style={s.text}>
          Loading Akshara.AI…&nbsp;<span style={s.pct}>{pct}%</span>
        </p>
        <div style={s.track}>
          <div style={{ ...s.fill, width: `${pct}%` }} />
        </div>
      </div>

      {/* Top wordmark */}
      <div style={s.wordmark}>AKSHARA.AI</div>
    </div>
  )
}

const s = {
  wrap: {
    position:       'fixed',
    inset:          0,
    zIndex:         9999,
    background:     '#ffffff',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    fontFamily:     "-apple-system,'Inter','Segoe UI',sans-serif",
  },
  canvas: {
    width:      '100vw',
    height:     'clamp(280px, 55vh, 500px)',
    background: 'transparent',
  },
  loaderWrap: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '10px',
    width:         'clamp(200px, 32vw, 320px)',
    marginTop:     '4px',
  },
  text: {
    margin:        0,
    color:         '#333333',
    fontSize:      'clamp(12px, 1.3vw, 14px)',
    fontWeight:    400,
    letterSpacing: '0.04em',
  },
  pct: {
    color:      '#333333',
    fontWeight: 600,
  },
  track: {
    width:        '100%',
    height:       '1.5px',
    background:   '#e0e0e0',
    borderRadius: '2px',
    overflow:     'hidden',
  },
  fill: {
    height:     '100%',
    background: '#222222',
    borderRadius: '2px',
    transition: 'width 0.1s ease',
  },
  wordmark: {
    position:      'absolute',
    top:           '32px',
    left:          '50%',
    transform:     'translateX(-50%)',
    color:         '#cccccc',
    fontSize:      'clamp(10px, 1.1vw, 12px)',
    letterSpacing: '0.45em',
    fontWeight:    600,
  },
}
