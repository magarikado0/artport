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
        <div className="space-y-2">
          <button onClick={() => navigate('/post')} className="w-full flex items-center justify-between bg-warm rounded-xl px-4 py-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="text-lg">✏️</span>
              <span className="font-sans text-[14px] text-ink">作品を投稿</span>
            </div>
            <span className="text-muted">→</span>
          </button>
          <button onClick={() => navigate('/exhibitions/create')} className="w-full flex items-center justify-between bg-warm rounded-xl px-4 py-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎨</span>
              <span className="font-sans text-[14px] text-ink">展覧会を作成</span>
            </div>
            <span className="text-muted">→</span>
          </button>
          <button onClick={() => navigate('/portfolio')} className="w-full flex items-center justify-between bg-warm rounded-xl px-4 py-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="text-lg">📖</span>
              <span className="font-sans text-[14px] text-ink">鑑賞記録を見る</span>
            </div>
            <span className="text-muted">→</span>
          </button>
          {user?.isAnonymous ? (
            <button onClick={() => navigate('/login')} className="w-full flex items-center justify-between bg-accent rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="text-lg">✨</span>
                <span className="font-sans text-[14px] text-paper font-medium">アカウント登録 / ログイン</span>
              </div>
              <span className="text-paper/70">→</span>
            </button>
          ) : (
            <button onClick={handleLogout} className="w-full flex items-center justify-between bg-paper rounded-xl px-4 py-3.5 border border-border">
              <div className="flex items-center gap-3">
                <span className="text-lg">🚪</span>
                <span className="font-sans text-[14px] text-muted">ログアウト</span>
              </div>
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