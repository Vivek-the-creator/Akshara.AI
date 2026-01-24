import React from 'react'

const ProgressBar = ({ 
  current = 0, 
  total = 100, 
  showPercentage = true, 
  showText = true,
  height = '20px',
  backgroundColor = '#e9ecef',
  fillColor = '#28a745',
  textColor = '#333',
  label = 'Progress'
}) => {
  const percentage = Math.min((current / total) * 100, 100)
  
  return (
    <div style={{ width: '100%' }}>
      {showText && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          fontSize: '14px',
          color: textColor
        }}>
          <span>{label}</span>
          {showPercentage && (
            <span>{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div style={{
        width: '100%',
        height: height,
        backgroundColor: backgroundColor,
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: '10px',
          transition: 'width 0.5s ease-in-out',
          position: 'relative',
          background: `linear-gradient(90deg, ${fillColor} 0%, ${fillColor}dd 100%)`
        }}>
          {percentage > 10 && (
            <span style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
