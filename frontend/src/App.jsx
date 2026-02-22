import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Appointments from './pages/Appointments'
import ConsultationEnhanced from './pages/ConsultationEnhanced'
import Vaccinations from './pages/Vaccinations'
import Documents from './pages/Documents'
import Users from './pages/Users'
import Clinics from './pages/Clinics'
import Settings from './pages/Settings'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="consultation/new" element={
              <ProtectedRoute roles={['admin', 'doctor']}>
                <ConsultationEnhanced />
              </ProtectedRoute>
            } />
            <Route path="consultation/:id" element={
              <ProtectedRoute roles={['admin', 'doctor']}>
                <ConsultationEnhanced />
              </ProtectedRoute>
            } />
            <Route path="vaccinations" element={<Vaccinations />} />
            <Route path="documents" element={<Documents />} />
            <Route path="users" element={
              <ProtectedRoute roles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="clinics" element={
              <ProtectedRoute roles={['admin']}>
                <Clinics />
              </ProtectedRoute>
            } />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </PreferencesProvider>
    </AuthProvider>
  )
}

export default App
