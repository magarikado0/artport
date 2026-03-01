import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import './styles/index.css'

import LoginPage from './pages/LoginPage'
import FeedPage from './pages/FeedPage'
import ExhibitionsPage from './pages/ExhibitionsPage'
import ExhibitionDetailPage from './pages/ExhibitionDetailPage'
import ExhibitionCreatePage from './pages/ExhibitionCreatePage'
import PostPage from './pages/PostPage'
import PortfolioPage from './pages/PortfolioPage'
import ArtistPage from './pages/ArtistPage'
import ArtworkDetailPage from './pages/ArtworkDetailPage'
import MyPage from './pages/MyPage'
import CameraPage from './pages/CameraPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-3xl text-paper mb-4">Art<span className="text-accent">port</span></p>
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path="/exhibitions" element={<PrivateRoute><ExhibitionsPage /></PrivateRoute>} />
      <Route path="/exhibitions/create" element={<PrivateRoute><ExhibitionCreatePage /></PrivateRoute>} />
      <Route path="/exhibitions/:id" element={<PrivateRoute><ExhibitionDetailPage /></PrivateRoute>} />
      <Route path="/post" element={<PrivateRoute><PostPage /></PrivateRoute>} />
      <Route path="/portfolio" element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
      <Route path="/artists/:id" element={<PrivateRoute><ArtistPage /></PrivateRoute>} />
      <Route path="/artworks/:id" element={<PrivateRoute><ArtworkDetailPage /></PrivateRoute>} />
      <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
      <Route path="/camera" element={<PrivateRoute><CameraPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="max-w-md mx-auto min-h-screen">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
