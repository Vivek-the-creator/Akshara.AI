import React from 'react'
import { useNavigate } from 'react-router-dom'

const LevelSelection = () => {
  const navigate = useNavigate()

  const stages = [
    {
      name: 'Beginner',
      description: 'Start with basic letters and sounds',
      icon: '🌱',
      unlocked: true,
      color: '#28a745'
    },
    {
      name: 'Intermediate',
      description: 'Practice words and simple sentences',
      icon: '🌿',
      unlocked: false,
      color: '#ffc107'
    },
    {
      name: 'Pro',
      description: 'Master complex writing and composition',
      icon: '🌳',
      unlocked: false,
      color: '#dc3545'
    }
  ]

  const handleStageClick = (stage) => {
    if (stage.unlocked) {
      navigate(`/levels/${stage.name.toLowerCase()}`)
    }
  }

  return (
    <div>
      <div className="card">
        <h1>Choose Your Learning Stage</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>
          Select a stage to begin your handwriting learning journey. Each stage builds upon the previous one.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {stages.map((stage) => (
            <div
              key={stage.name}
              onClick={() => handleStageClick(stage)}
              style={{
                padding: '40px 30px',
                borderRadius: '12px',
                backgroundColor: stage.unlocked ? '#ffffff' : '#f8f9fa',
                border: stage.unlocked ? `2px solid ${stage.color}` : '2px solid #dee2e6',
                cursor: stage.unlocked ? 'pointer' : 'not-allowed',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                opacity: stage.unlocked ? 1 : 0.6,
                transform: stage.unlocked ? 'scale(1)' : 'scale(0.95)'
              }}
              onMouseEnter={(e) => {
                if (stage.unlocked) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (stage.unlocked) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                {stage.icon}
              </div>
              <h2 style={{ margin: '0 0 10px 0', color: stage.unlocked ? stage.color : '#6c757d' }}>
                {stage.name}
              </h2>
              <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '16px' }}>
                {stage.description}
              </p>
              <div style={{
                padding: '8px 16px',
                backgroundColor: stage.unlocked ? stage.color : '#6c757d',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                {stage.unlocked ? 'START' : 'LOCKED'}
              </div>
              {!stage.unlocked && (
                <p style={{ margin: '15px 0 0 0', fontSize: '12px', color: '#999' }}>
                  Complete previous stage to unlock
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>How Progress Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔓</div>
            <h4>Sequential Learning</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Complete each level to unlock the next one
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>⭐</div>
            <h4>Star Ratings</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Earn stars based on your performance and attempts
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📈</div>
            <h4>Track Progress</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Monitor your learning journey and improvements
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LevelSelection
