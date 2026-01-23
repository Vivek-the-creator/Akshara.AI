import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { writingService } from '../services/writingService'

const Dashboard = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await writingService.getSessions()
        setSessions(data)
      } catch (error) {
        setError('Failed to load writing sessions')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="card">
        <h1>Welcome to Your Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3>👤 User Information</h3>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Full Name:</strong> {user?.full_name || 'Not set'}</p>
            <p><strong>Age:</strong> {user?.age || 'Not set'}</p>
            <p><strong>Learning Language:</strong> {user?.learning_language || 'Not set'}</p>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h3>📊 Learning Progress</h3>
            <p><strong>Total Writing Sessions:</strong> {sessions.length}</p>
            <p><strong>Account Status:</strong> <span style={{ color: '#28a745' }}>Active</span></p>
            <p><strong>Member Since:</strong> {user?.created_at ? formatDate(user.created_at) : 'Unknown'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Writing Sessions</h2>
        {loading ? (
          <div className="loading">Loading sessions...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No writing sessions yet. Start your first writing practice!</p>
            <a href="/writing" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>
              Start Writing Practice
            </a>
          </div>
        ) : (
          <div>
            {sessions.map((session) => (
              <div key={session.id} style={{ 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                marginBottom: '10px',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{session.title || 'Untitled Session'}</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                      Created: {formatDate(session.created_at)}
                    </p>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                      Language: {session.language || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {session.status || 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/writing" className="btn">
            📝 Start Writing Practice
          </a>
          <a href="/voice-practice" className="btn" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            🎤 Voice Practice
          </a>
          <button className="btn btn-secondary" disabled>
            📈 View Progress (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
