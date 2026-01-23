import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { writingService } from '../services/writingService'
import { progressService } from '../services/progressService'
import { aiService } from '../services/aiService'
import audioService from '../utils/audioUtils'

const LetterPractice = () => {
  const navigate = useNavigate()
  const { level } = useParams()
  const { user } = useAuth()
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  const [attempts, setAttempts] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [stars, setStars] = useState(0)
  const [existingProgress, setExistingProgress] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)

  const fileInputRef = useRef(null)

  // Tamil Uyir Ezhuthugal data
  const uyirEzhuthugal = [
    { letter: 'அ', pronunciation: 'ah', level: 1 },
    { letter: 'ஆ', pronunciation: 'aa', level: 2 },
    { letter: 'இ', pronunciation: 'i', level: 3 },
    { letter: 'ஈ', pronunciation: 'ii', level: 4 },
    { letter: 'உ', pronunciation: 'u', level: 5 },
    { letter: 'ஊ', pronunciation: 'uu', level: 6 },
    { letter: 'எ', pronunciation: 'e', level: 7 },
    { letter: 'ஏ', pronunciation: 'ee', level: 8 },
    { letter: 'ஐ', pronunciation: 'ai', level: 9 },
    { letter: 'ஒ', pronunciation: 'o', level: 10 },
    { letter: 'ஓ', pronunciation: 'oo', level: 11 },
    { letter: 'ஔ', pronunciation: 'au', level: 12 }
  ]

  const currentLetter = uyirEzhuthugal.find(item => item.level === parseInt(level))

  useEffect(() => {
    // Load existing progress for this level
    const loadProgress = async () => {
      try {
        const progressData = await progressService.getLevelProgress('Beginner', 'Uyir Ezhuthugal', parseInt(level))
        setExistingProgress(progressData)
        setAttempts(progressData.attempts_count || 0)
        setStars(progressData.stars_awarded || 0)
        
        // If already completed, show success state
        if (progressData.completed_at) {
          setShowSuccess(true)
        }
      } catch (error) {
        // No existing progress, start fresh
        setAttempts(0)
        setStars(0)
      }
    }
    
    if (currentLetter) {
      loadProgress()
    }
  }, [level, currentLetter])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file')
        setMessageType('error')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB')
        setMessageType('error')
        return
      }
      
      setSelectedFile(file)
      setMessage('')
      
      // Create image preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const playPronunciation = async () => {
    try {
      if (!audioService.isSupported()) {
        alert('Speech synthesis is not supported in your browser. Please try Chrome, Edge, or Safari.')
        return
      }
      
      setAudioLoading(true)
      
      await audioService.pronounceLetter(currentLetter.letter, user?.learning_language || 'Tamil')
      
    } catch (error) {
      console.error('Error playing pronunciation:', error)
      alert('Unable to play pronunciation. Please check your browser settings.')
    } finally {
      setAudioLoading(false)
    }
  }

  const calculateStars = (attemptCount) => {
    if (attemptCount <= 3) return 3
    if (attemptCount <= 7) return 2
    return 1
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setMessage('Please select an image to upload')
      setMessageType('error')
      return
    }

    setUploading(true)
    setMessage('Analyzing your handwriting with AI...')
    setMessageType('')

    try {
      // Use AI evaluation instead of placeholder
      const evaluationResult = await aiService.evaluateHandwriting(
        selectedFile,
        user.learning_language || 'Tamil',
        'beginner',
        currentLetter.level,
        currentLetter.letter
      )

      // Update attempts
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      // Process AI evaluation result
      if (evaluationResult.success && evaluationResult.evaluation) {
        const evaluation = evaluationResult.evaluation
        
        if (evaluation.is_correct || evaluation.can_proceed) {
          // Letter is correct - save progress and show success
          const earnedStars = calculateStars(newAttempts)
          setStars(earnedStars)
          
          // Save progress
          await progressService.createOrUpdateProgress({
            user_id: user.id,
            language: user.learning_language || 'Tamil',
            stage: 'beginner',
            category: 'uyir-ezhuthugal',
            level_number: currentLetter.level,
            expected_character: currentLetter.letter,
            attempts_count: newAttempts,
            stars_awarded: earnedStars,
            completed_at: new Date().toISOString()
          })

          setMessage(`Excellent! ${evaluation.feedback || 'Great job!'}`)
          setMessageType('success')
          setShowSuccess(true)
          
          // Clear image and preview only after successful evaluation
          setSelectedFile(null)
          setImagePreview(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        } else {
          // Letter is incorrect - show feedback but keep image for retry
          setMessage(evaluation.feedback || 'Keep practicing! Try again.')
          setMessageType('error')
          
          // Show improvement tips
          if (evaluation.improvements && evaluation.improvements.length > 0) {
            const tips = evaluation.improvements.join(' ')
            setMessage(prev => `${prev} ${tips}`)
          }
          // Don't clear image - let user try again
        }
      } else {
        throw new Error('AI evaluation failed')
      }

    } catch (error) {
      console.error('Error evaluating handwriting:', error)
      setMessage('Unable to evaluate your handwriting. Please try again.')
      setMessageType('error')
    } finally {
      setUploading(false)
    }
  }

  const saveProgress = async (attemptCount, earnedStars, completed) => {
    try {
      const progressData = {
        user_id: user.id,
        language: user.learning_language || 'Tamil',
        stage: 'Beginner',
        category: 'Uyir Ezhuthugal',
        level_number: parseInt(level),
        expected_character: currentLetter.letter,
        attempts_count: attemptCount,
        stars_awarded: earnedStars,
        completed_at: completed ? new Date().toISOString() : null
      }
      
      await progressService.createOrUpdateProgress(progressData)
      console.log('Progress saved successfully:', progressData)
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleNextLevel = () => {
    const nextLevel = parseInt(level) + 1
    if (nextLevel <= 12) {
      navigate(`/practice/beginner/uyir-ezhuthugal/${nextLevel}`)
    } else {
      navigate('/levels/beginner')
    }
  }

  const handleRetry = () => {
    setShowSuccess(false)
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!currentLetter) {
    return (
      <div className="card">
        <h1>Level Not Found</h1>
        <p>The requested level could not be found.</p>
        <button onClick={() => navigate('/levels/beginner')} className="btn">
          Back to Beginner Levels
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Letter Practice - Level {level}</h1>
          <button 
            onClick={() => navigate('/levels/beginner')}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Levels
          </button>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
              maxWidth: '400px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Level Cleared!</h2>
              <p style={{ margin: '0 0 20px 0', color: '#666' }}>
                You successfully wrote "{currentLetter.letter}"
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Stars Earned:</p>
                <div>
                  {[1, 2, 3].map((star) => (
                    <span 
                      key={star} 
                      style={{ 
                        fontSize: '24px', 
                        color: star <= stars ? '#ffc107' : '#ddd',
                        margin: '0 2px'
                      }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  Attempts: {attempts}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={handleRetry}
                  className="btn btn-secondary"
                >
                  Try Again
                </button>
                {parseInt(level) < 12 && (
                  <button 
                    onClick={handleNextLevel}
                    className="btn"
                  >
                    Next Level →
                  </button>
                )}
                {parseInt(level) === 12 && (
                  <button 
                    onClick={() => navigate('/levels/beginner')}
                    className="btn"
                  >
                    Back to Levels
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Letter Display Section */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f8f9fa', padding: '40px', borderRadius: '12px' }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#2d5a2d' }}>
                Write this letter:
              </h2>
              
              <div style={{ 
                fontSize: '120px', 
                fontWeight: 'bold', 
                margin: '20px 0',
                color: '#2d5a2d',
                lineHeight: 1
              }}>
                {currentLetter.letter}
              </div>
              
              <button
                onClick={playPronunciation}
                disabled={audioLoading}
                data-pronunciation-btn
                style={{
                  backgroundColor: audioLoading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  fontSize: '24px',
                  cursor: audioLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  transition: 'all 0.3s ease',
                  opacity: audioLoading ? 0.7 : 1
                }}
                title={`Pronounce: ${currentLetter.pronunciation}`}
              >
                {audioLoading ? '⏳' : '🔊'}
              </button>
              
              <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
                Click speaker to hear pronunciation: "{currentLetter.pronunciation}"
              </p>
            </div>

            {/* Instructions */}
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px' 
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Instructions:</h4>
              <ol style={{ margin: '0', paddingLeft: '20px', textAlign: 'left' }}>
                <li>Write the letter "{currentLetter.letter}" on paper</li>
                <li>Take a clear photo of your writing</li>
                <li>Upload the image below</li>
                <li>Get instant feedback and unlock the next level!</li>
              </ol>
            </div>
          </div>

          {/* Upload Section */}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Upload Your Handwriting:</h3>
            
            {/* Image Preview */}
            {imagePreview && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'inline-block'
                }}>
                  <img 
                    src={imagePreview} 
                    alt="Handwriting preview" 
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      display: 'block',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}
            
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '20px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  style={{
                    padding: '10px',
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    width: '100%',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    backgroundColor: uploading ? '#f8f9fa' : 'white'
                  }}
                />
              </div>
              
              {selectedFile && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    Selected: {selectedFile.name}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                    Size: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="btn"
                style={{
                  opacity: (!selectedFile || uploading) ? 0.6 : 1,
                  cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Analyzing...' : 'Submit for Evaluation'}
              </button>
            </form>
            
            {/* Attempts Counter */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Attempts this level: <strong>{attempts}</strong>
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                ⭐⭐⭐ = 3 attempts or less<br/>
                ⭐⭐ = 7 attempts or less<br/>
                ⭐ = More than 7 attempts
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && !showSuccess && (
          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            borderRadius: '4px',
            backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
            color: messageType === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default LetterPractice
