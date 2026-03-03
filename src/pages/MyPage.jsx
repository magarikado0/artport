import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/layout/BottomNav'

const DEMO_HISTORY = [
  { title: '静寂の筆跡', artist: '山田 碧', genre: '書道', date: '今日', bg: 'linear-gradient(135deg,#e8e0d0,#d4c8b4)', symbol: '書' },
  { title: '霧の朝', artist: '田中 光', genre: '写真', date: '昨日', bg: 'linear-gradient(135deg,#d4dce8,#c0ccd8)', symbol: '📷' },
]

export default function MyPage() {
  const { user, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await logout()
      navigate('/login')
    }
  }

  return (
    <div className="h-screen bg-paper flex flex-col">
      {/* Header with profile */}
      <div className="px-5 pt-6 pb-4 bg-paper border-b border-border text-center">
        <div className="w-[80px] h-[80px] rounded-full bg-warm mx-auto mb-3 overflow-hidden border-[3px] border-paper shadow-[0_0_0_2px_#d4ccc2]">
          {userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
          )}
        </div>
        <h1 className="font-serif text-[22px] mb-1 text-ink">{userProfile?.name || 'ゲスト'}</h1>
        <p className="font-mono text-[10px] text-muted tracking-wider mb-3">{userProfile?.email || ''}</p>
        <div className="flex justify-center gap-6">
          {[{num:'12',label:'投稿'},{num:'47',label:'鑑賞'},{num:'8',label:'展覧会'}].map(s => (
            <div key={s.label}>
              <span className="block font-serif text-xl text-center text-ink">{s.num}</span>
              <span className="font-mono text-[9px] text-muted tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      {/* Menu section */}
      <div className="px-5 pt-4">
        <p className="section-title">✦ メニュー</p>
        <div className="grid grid-cols-2 gap-2.5">
          {/* 作品を投稿 */}
          <button onClick={() => navigate('/post')}
            className="flex flex-col items-center justify-center gap-2 bg-warm rounded-2xl py-5 border border-border active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="font-mono text-[11px] text-ink tracking-wide">作品を投稿</span>
          </button>
          {/* 展覧会を作成 */}
          <button onClick={() => navigate('/exhibitions/create')}
            className="flex flex-col items-center justify-center gap-2 bg-warm rounded-2xl py-5 border border-border active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
              <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
              <rect x="9" y="14" width="6" height="7" />
            </svg>
            <span className="font-mono text-[11px] text-ink tracking-wide">展覧会を作成</span>
          </button>
          {/* 鑑賞記録 */}
          <button onClick={() => navigate('/portfolio')}
            className="flex flex-col items-center justify-center gap-2 bg-warm rounded-2xl py-5 border border-border active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
              <path d="M12 21C7 16 3 12.4 3 8.5A5.5 5.5 0 0112 4.09 5.5 5.5 0 0121 8.5c0 3.9-4 7.5-9 12.5z" />
            </svg>
            <span className="font-mono text-[11px] text-ink tracking-wide">鑑賞記録</span>
          </button>
          {/* ログアウト or サインアップ */}
          {user?.isAnonymous ? (
            <button onClick={() => navigate('/login')}
              className="flex flex-col items-center justify-center gap-2 bg-accent rounded-2xl py-5 active:scale-95 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              <span className="font-mono text-[11px] text-paper tracking-wide">登録 / ログイン</span>
            </button>
          ) : (
            <button onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-2 bg-warm rounded-2xl py-5 border border-border active:scale-95 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="font-mono text-[11px] text-muted tracking-wide">ログアウト</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-5 pt-5">
        <p className="section-title">✦ 最近の活動</p>
        <div className="space-y-0">
          {DEMO_HISTORY.map((h,i) => (
            <div key={i} className="flex gap-3 items-center py-3 border-b border-border">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl opacity-25"
                style={{background:h.bg}}>{h.symbol}</div>
              <div className="flex-1">
                <p className="font-serif text-[14px] mb-0.5 text-ink">{h.title}</p>
                <p className="font-mono text-[9px] text-muted">{h.artist} · {h.genre}</p>
              </div>
              <span className="font-mono text-[9px] text-muted">{h.date}</span>
            </div>
          ))}
        </div>
      </div>

      </div>

      <BottomNav />
    </div>
  )
}