import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './BeginnerVoicePractice.css'

const BeginnerVoicePractice = () => {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({})
  
  const recognitionRef = useRef(null)

  useEffect(() => {
    fetchWords()
    fetchProgress()
    setupSpeechRecognition()
  }, [])

  const fetchWords = async () => {
    try {
      const response = await fetch('/api/voice-practice/beginner-words')
      const data = await response.json()
      setWords(data.words)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch words:', error)
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo_user'
      const response = await fetch(`/api/voice-practice/progress/${userId}`)
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  const setupSpeechRecognition = () => {
    console.log('🎤 Setting up speech recognition...')
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      // Try English first, as Tamil may not be supported
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onstart = () => {
        console.log('🎤 Speech recognition started')
      }
      
      recognitionRef.current.onresult = (event) => {
        console.log('🎤 Speech recognition result received:', event.results)
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        
        console.log('🎤 Recognized:', transcript, 'Confidence:', confidence)
        handleSpeechResult(transcript, confidence)
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error)
        setIsListening(false)
        setIsRecording(false)
        
        if (event.error === 'no-speech') {
          setFeedback('No speech detected. Please try speaking clearly: "Vanakkam"')
        } else if (event.error === 'not-allowed') {
          setFeedback('Microphone access denied. Please allow microphone permissions.')
        } else if (event.error === 'network') {
          setFeedback('Network error. Please check your internet connection.')
        } else {
          setFeedback(`Speech recognition error: ${event.error}. Please try again.`)
        }
      }
      
      recognitionRef.current.onend = () => {
        console.log('🎤 Speech recognition ended')
        setIsListening(false)
        setIsRecording(false)
      }
      
      console.log('✅ Speech recognition setup complete')
    } else {
      console.error('❌ Speech recognition not supported')
      setFeedback('Speech recognition is not supported in your browser. Try using Chrome.')
    }
  }

  const handleSpeechResult = (transcript, confidence) => {
    const currentWord = words[currentIndex]
    if (!currentWord) return
    
    console.log('🎯 Processing speech result...')
    console.log('🎯 Expected (Tamil):', currentWord.tamil_text)
    console.log('🎯 Expected (English):', currentWord.romanization)
    console.log('🎯 Spoken:', transcript)
    console.log('🎯 Confidence:', confidence)
    
    // Calculate pronunciation accuracy with both Tamil and Romanization
    const tamilAccuracy = calculatePronunciationAccuracy(
      currentWord.tamil_text,
      transcript
    )
    
    const englishAccuracy = calculatePronunciationAccuracy(
      currentWord.romanization.toLowerCase(),
      transcript.toLowerCase()
    )
    
    // Use the better of the two accuracies
    const accuracy = Math.max(tamilAccuracy, englishAccuracy)
    
    // Boost score if confidence is high
    const confidenceBonus = confidence > 0.8 ? 5 : 0
    const finalScore = Math.min(100, Math.round((accuracy * 0.7 + confidence * 100 * 0.3) + confidenceBonus))
    
    console.log('🎯 Tamil Accuracy:', tamilAccuracy)
    console.log('🎯 English Accuracy:', englishAccuracy)
    console.log('🎯 Final Accuracy:', accuracy)
    console.log('🎯 Final Score:', finalScore)
    
    setScore(finalScore)
    
    // Enhanced feedback messages based on score and word
    let feedbackMessage = ''
    let encouragement = ''
    
    if (finalScore >= 95) {
      feedbackMessage = '🌟 PERFECT! Amazing pronunciation!'
      encouragement = 'You\'re a natural at Tamil!'
    } else if (finalScore >= 85) {
      feedbackMessage = '🎉 EXCELLENT! Great job!'
      encouragement = 'Your pronunciation is fantastic!'
    } else if (finalScore >= 75) {
      feedbackMessage = '👍 VERY GOOD! Keep it up!'
      encouragement = 'You\'re getting really good at this!'
    } else if (finalScore >= 60) {
      feedbackMessage = '😊 GOOD EFFORT! Almost there!'
      encouragement = 'Listen again and try once more!'
    } else if (finalScore >= 40) {
      feedbackMessage = '🎯 NICE TRY! Keep practicing!'
      encouragement = 'Say it clearly: "' + currentWord.romanization + '"'
    } else {
      feedbackMessage = '💪 KEEP TRYING! You can do it!'
      encouragement = 'Listen carefully and repeat: "' + currentWord.romanization + '"'
    }
    
    const fullFeedback = `${feedbackMessage} ${encouragement}`
    setFeedback(fullFeedback)
    
    // Add visual feedback based on score
    if (finalScore >= 85) {
      console.log('🏆 Achievement: Excellent pronunciation!')
    } else if (finalScore >= 70) {
      console.log('⭐ Achievement: Good pronunciation!')
    }
    
    // Save attempt
    saveAttempt(currentWord.id, transcript, finalScore)
  }

  const calculatePronunciationAccuracy = (expected, spoken) => {
    const expectedLower = expected.toLowerCase().trim()
    const spokenLower = spoken.toLowerCase().trim()
    
    if (expectedLower === spokenLower) return 100
    
    const distance = levenshteinDistance(expectedLower, spokenLower)
    const maxLength = Math.max(expectedLower.length, spokenLower.length)
    
    return Math.max(0, ((maxLength - distance) / maxLength) * 100)
  }

  const levenshteinDistance = (str1, str2) => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const saveAttempt = async (wordId, spoken, finalScore) => {
    try {
      const userId = localStorage.getItem('userId') || 'demo_user'
      
      await fetch('/api/voice-practice/save-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          word_id: wordId,
          spoken_text: spoken,
          score: finalScore,
          confidence: 80
        })
      })
      
      // Refresh progress
      fetchProgress()
    } catch (error) {
      console.error('Failed to save attempt:', error)
    }
  }

  const playAudio = () => {
    const currentWord = words[currentIndex]
    if (!currentWord) return
    
    console.log('🔊 Playing pronunciation:', currentWord.romanization)
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      // Play the English pronunciation directly
      const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => {
        console.log('✅ Playing:', currentWord.romanization)
      }
      
      utterance.onend = () => {
        console.log('✅ Audio finished')
      }
      
      utterance.onerror = (event) => {
        console.error('❌ Audio error:', event.error)
        setFeedback('Audio playback failed. Please try again.')
      }
      
      window.speechSynthesis.speak(utterance)
    } else {
      console.error('❌ Speech synthesis not supported')
      setFeedback('Audio is not supported in your browser')
    }
  }

  const startRecording = async () => {
    console.log('🎤 Starting recording...')
    
    if (!recognitionRef.current) {
      setFeedback('Speech recognition is not supported in your browser')
      return
    }
    
    // Check microphone permissions first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
      console.log('✅ Microphone permission granted')
    } catch (error) {
      console.error('❌ Microphone permission denied:', error)
      setFeedback('Microphone access denied. Please allow microphone permissions in your browser.')
      return
    }
    
    setIsRecording(true)
    setIsListening(true)
    setScore(null)
    setFeedback('')
    
    try {
      recognitionRef.current.start()
      console.log('🎤 Recognition started')
    } catch (error) {
      console.error('❌ Failed to start recognition:', error)
      setIsRecording(false)
      setIsListening(false)
      setFeedback('Failed to start speech recognition. Please try again.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScore(null)
      setFeedback('')
    } else {
      navigate('/dashboard')
    }
  }

  const getScoreStars = (score) => {
    if (score >= 95) {
      return '⭐⭐⭐⭐⭐ Perfect!'
    } else if (score >= 85) {
      return '⭐⭐⭐⭐ Excellent!'
    } else if (score >= 75) {
      return '⭐⭐⭐ Very Good!'
    } else if (score >= 60) {
      return '⭐⭐ Good Effort!'
    } else if (score >= 40) {
      return '⭐ Keep Trying!'
    } else {
      return '🎯 Practice More!'
    }
  }

  const retryWord = () => {
    setScore(null)
    setFeedback('')
  }

  if (loading) {
    return <div className="loading">Loading Tamil words...</div>
  }

  if (words.length === 0) {
    return <div className="error">No words available.</div>
  }

  const currentWord = words[currentIndex]
  const progressPercentage = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="beginner-voice-practice">
      <div className="practice-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <h2>🎤 Beginner Tamil Practice</h2>
        <div className="progress-info">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
      </div>

      {progress.completion_percentage > 0 && (
        <div className="overall-progress">
          <h3>Your Progress: {progress.completion_percentage.toFixed(0)}%</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill completed" 
              style={{ width: `${progress.completion_percentage}%` }} 
            />
          </div>
        </div>
      )}

      <div className="practice-card">
        <div className="word-display">
          <div className="tamil-word">{currentWord.tamil_text}</div>
          <div className="english-word">{currentWord.english_translation}</div>
          <div className="romanization">{currentWord.romanization}</div>
        </div>

        <div className="controls">
          <button 
            onClick={playAudio}
            className="audio-button"
            title="Listen to pronunciation"
          >
            🔊 Listen
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={isListening}
          >
            {isRecording ? '⏹️ Stop' : '🎤 Speak'}
          </button>
        </div>

        {isListening && (
          <div className="listening-indicator">
            🎤 Listening... Speak clearly in Tamil
          </div>
        )}

        {score !== null && (
          <div className={`score-feedback ${score >= 85 ? 'excellent' : score >= 70 ? 'good' : 'poor'}`}>
            <div className="score-stars">
              {getScoreStars(score)}
            </div>
            <div className="score-display">
              Score: {score}/100
            </div>
            <div className="feedback-text">
              {feedback}
            </div>
            <div className="action-buttons">
              {score < 80 && (
                <button onClick={retryWord} className="retry-button">
                  🔄 Try Again
                </button>
              )}
              <button onClick={nextWord} className="next-button">
                {currentIndex < words.length - 1 ? 'Next →' : 'Finish ✅'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BeginnerVoicePractice
