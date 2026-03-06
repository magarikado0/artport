import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import OnboardingOverlay from './components/OnboardingOverlay'
import './styles/index.css'

import LoginPage from './pages/LoginPage'
import EmailLoginPage from './pages/EmailLoginPage'
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
import ViewingRecordDetailPage from './pages/ViewingRecordDetailPage'

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

// 匿名ユーザーはログイン画面へ誘導するガード
function AuthRequiredRoute({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // 匿名ユーザーの場合はログイン促進モーダルを表示
  if (user.isAnonymous) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-8">
        <div className="bg-ink rounded-3xl p-8 w-full max-w-sm text-center">
          <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-4">✦ ログインが必要です</p>
          <h2 className="font-serif text-2xl text-paper font-light mb-3">この機能を使うには<br />ログインしてください</h2>
          <p className="font-sans text-[13px] text-paper/50 mb-8 leading-relaxed">
            投稿・展覧会作成はログイン済みのユーザーのみ利用できます
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full mb-3"
          >
            ログイン / 新規登録
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary w-full"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return children
}

function AppRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname.startsWith('/login')
  return (
    <OnboardingOverlay skip={isLoginPage}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/email" element={<EmailLoginPage />} />
      <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path="/exhibitions" element={<PrivateRoute><ExhibitionsPage /></PrivateRoute>} />
      <Route path="/exhibitions/create" element={<AuthRequiredRoute><ExhibitionCreatePage /></AuthRequiredRoute>} />
      <Route path="/exhibitions/:id" element={<PrivateRoute><ExhibitionDetailPage /></PrivateRoute>} />
      <Route path="/post" element={<AuthRequiredRoute><PostPage /></AuthRequiredRoute>} />
      <Route path="/portfolio" element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
      <Route path="/artists/:id" element={<PrivateRoute><ArtistPage /></PrivateRoute>} />
      <Route path="/artworks/:id" element={<PrivateRoute><ArtworkDetailPage /></PrivateRoute>} />
      <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
      <Route path="/camera" element={<PrivateRoute><CameraPage /></PrivateRoute>} />
      <Route path="/portfolio/:id" element={<PrivateRoute><ViewingRecordDetailPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </OnboardingOverlay>
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
