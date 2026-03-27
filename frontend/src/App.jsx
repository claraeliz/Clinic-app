import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PatientsView from './pages/PatientsView'
import NewTestResult from './pages/NewTestResult'
import Profile from './pages/Profile'
import Users from './pages/Users'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login"    element={!user ? <Login />    : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/pacienti" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'FRONT_DESK', 'MEDIC']}>
          <Layout><PatientsView /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/pacienti/:id" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'FRONT_DESK', 'MEDIC']}>
          <Layout><PatientsView /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/rezultate-analize/nou" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MEDIC']}>
          <Layout><NewTestResult /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/rezultate-analize/:id/editeaza" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MEDIC']}>
          <Layout><NewTestResult /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/profil" element={
        <ProtectedRoute>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/utilizatori" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><Users /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/unauthorized" element={
        <div className="flex items-center justify-center h-screen text-slate-500">
          Nu ai acces la această pagină.
        </div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
