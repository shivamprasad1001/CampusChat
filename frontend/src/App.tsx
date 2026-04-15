import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import RootPage from './pages/RootPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import AppLayout from './pages/app/AppLayout'
import RoomPage from './pages/app/RoomPage'
import DMPage from './pages/app/DMPage'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* App Routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<RootPage />} />
          <Route path="rooms/:roomId" element={<RoomPage />} />
          <Route path="dm/:userId" element={<DMPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
