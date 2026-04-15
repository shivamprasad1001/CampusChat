import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './globals.css'
import { AuthProvider } from './hooks/useAuth'
import { SettingsProvider } from './hooks/useSettings'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
