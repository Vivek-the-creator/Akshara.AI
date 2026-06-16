import React from 'react'
import Layout from '../components/Layout'
import './Settings.css'

const SETTINGS_SECTIONS = [
  {
    title: 'Learning Preferences',
    icon: '🎯',
    items: [
      { label: 'Daily Goal', value: '15 minutes', action: 'Change' },
      { label: 'Practice Reminders', value: '9:00 AM', action: 'Edit' },
    ]
  },
  {
    title: 'Account Settings',
    icon: '👤',
    items: [
      { label: 'Email', value: 'learner@example.com', action: 'Change' },
      { label: 'Password', value: '••••••••', action: 'Update' },
    ]
  },
  {
    title: 'App Settings',
    icon: '⚙️',
    items: [
      { label: 'Language', value: 'English', action: 'Change' },
      { label: 'Dark Mode', value: 'Off', action: 'Toggle' },
      { label: 'Sound Effects', value: 'On', action: 'Toggle' },
    ]
  }
]

export default function Settings() {
  return (
    <Layout>
      <div className="settings">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your learning experience</p>

        <div className="settings-sections">
          {SETTINGS_SECTIONS.map((section, i) => (
            <div key={i} className="settings-section glass-card">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <h2 className="section-title">{section.title}</h2>
              </div>
              <div className="section-items">
                {section.items.map((item, j) => (
                  <div key={j} className="settings-item">
                    <div className="item-info">
                      <p className="item-label">{item.label}</p>
                      <p className="item-value">{item.value}</p>
                    </div>
                    <button className="item-btn btn-secondary">{item.action}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}