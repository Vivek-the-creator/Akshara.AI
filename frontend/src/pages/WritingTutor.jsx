import React, { useState, useRef } from 'react'
import { writingService } from '../services/writingService'

const WritingTutor = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  const [isRecording, setIsRecording] = useState(false)

  const fileInputRef = useRef(null)

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
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setMessage('Please select an image file')
      setMessageType('error')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const response = await writingService.uploadImage(selectedFile, title)
      setMessage(`✅ ${response.message}`)
      setMessageType('success')
      
      // Reset form
      setSelectedFile(null)
      setTitle('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setMessage(`❌ ${error.detail || 'Upload failed'}`)
      setMessageType('error')
    } finally {
      setUploading(false)
    }
  }

  const handleMicrophoneClick = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      setMessage('🎤 Voice recording feature will be available in future phases')
      setMessageType('success')
      setTimeout(() => setIsRecording(false), 2000)
    }
  }

  return (
    <div>
      <div className="card">
        <h1>Writing Tutor</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Upload images of your writing for AI-powered analysis and feedback.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Image Upload Section */}
          <div>
            <h3>📷 Upload Writing Image</h3>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label htmlFor="title">Session Title (Optional)</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., My English Practice"
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Select Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleFileSelect}
                  required
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </small>
              </div>

              {selectedFile && (
                <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <p style={{ margin: '0' }}>
                    <strong>Selected file:</strong> {selectedFile.name}
                  </p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <button 
                type="submit" 
                className="btn" 
                disabled={uploading}
                style={{ width: '100%' }}
              >
                {uploading ? 'Uploading...' : 'Upload for Analysis'}
              </button>
            </form>
          </div>

          {/* Voice Recording Section */}
          <div>
            <h3>🎤 Voice Practice</h3>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <button
                onClick={handleMicrophoneClick}
                className={`btn ${isRecording ? 'btn-secondary' : ''}`}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  fontSize: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  backgroundColor: isRecording ? '#dc3545' : '#007bff'
                }}
              >
                🎤
              </button>
              <p style={{ color: '#666' }}>
                {isRecording ? 'Recording...' : 'Click to start voice practice'}
              </p>
              <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                Voice recognition features will be available in future phases
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
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

      <div className="card">
        <h2>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
            <h4>1. Upload Image</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Take a photo or upload an image of your writing
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🤖</div>
            <h4>2. AI Analysis</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Our AI analyzes your writing for grammar, spelling, and style
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
            <h4>3. Get Feedback</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Receive personalized feedback and improvement suggestions
            </p>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>⚠️ Current Phase Limitations</h4>
          <p style={{ margin: '0', color: '#856404' }}>
            This is Phase 1 of our platform. Image upload is functional, but AI analysis and OCR processing will be implemented in future phases. 
            Currently, uploaded images are stored and will be processed when advanced features are available.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WritingTutor
