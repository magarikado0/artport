import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { loginWithGoogle, loginAnonymously } = useAuth()
  const navigate = useNavigate()

  async function handleLogin() {
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (e) {
      console.error(e)
    }
  }

  // メールアドレスログイン用の関数（仮実装）
  function handleEmailLogin() {
    navigate('/login/email')
  }

  // 匿名ログイン
  async function handleAnonymousLogin() {
    try {
      await loginAnonymously()
      navigate('/')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-4">
          ✦ Art Discovery
        </p>
        <h1 className="font-serif text-5xl text-paper font-light leading-tight mb-3">
          Art<span className="text-accent">port</span>
        </h1>
        <p className="font-serif text-lg text-paper/50 italic mb-2">
          興味がなかったアートに、
        </p>
        <p className="font-serif text-lg text-paper/50 italic mb-12">
          気づいたら興味を持っていた。
        </p>

        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-paper text-ink rounded-2xl px-7 py-4 font-sans text-[14px] font-medium shadow-lg cursor-pointer border-none mb-3 w-full justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Google でログイン
        </button>

        <button
          onClick={handleEmailLogin}
          className="flex items-center gap-3 bg-transparent text-paper rounded-2xl px-7 py-4 font-sans text-[14px] font-medium cursor-pointer border border-paper/30 mb-4 w-full justify-center hover:bg-paper/5 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="14" height="10" rx="1.5" />
            <path d="M2 6l7 4 7-4" />
          </svg>
          メールアドレスでログイン
        </button>

        {/* 区切り線 */}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px bg-paper/15" />
          <span className="font-mono text-[9px] text-paper/30 tracking-wide">または</span>
          <div className="flex-1 h-px bg-paper/15" />
        </div>

        <button
          onClick={handleAnonymousLogin}
          className="flex items-center gap-3 bg-transparent text-paper/50 rounded-2xl px-7 py-3 font-sans text-[13px] cursor-pointer border border-paper/15 mb-4 w-full justify-center hover:bg-paper/5 transition-colors"
        >
          ゲストとして見るだけ
        </button>

        <p className="font-mono text-[9px] text-paper/25 tracking-wide text-center leading-relaxed">
          ログインすることで利用規約に同意したものとみなします
        </p>
      </div>
    </div>
  )
}
