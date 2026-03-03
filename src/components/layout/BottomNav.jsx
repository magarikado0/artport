import { useNavigate, useLocation } from 'react-router-dom'

// SVGアイコン定義
const IconFeed = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const IconExhibition = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
    <rect x="9" y="14" width="6" height="7" />
  </svg>
)

const IconPortfolio = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21C7 16 3 12.4 3 8.5A5.5 5.5 0 0112 4.09 5.5 5.5 0 0121 8.5c0 3.9-4 7.5-9 12.5z" />
  </svg>
)

const IconMyPage = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

const LEFT_ITEMS = [
  { Icon: IconFeed, label: 'フィード', path: '/' },
  { Icon: IconExhibition, label: '展覧会', path: '/exhibitions' },
]
const RIGHT_ITEMS = [
  { Icon: IconPortfolio, label: '記録', path: '/portfolio' },
  { Icon: IconMyPage, label: 'マイページ', path: '/mypage' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="bottom-nav relative">
      {/* 左2つ */}
      {LEFT_ITEMS.map(({ Icon, label, path }) => (
        <div key={path} className={`nav-item ${isActive(path) ? 'active' : ''}`} onClick={() => navigate(path)}>
          <span className={`nav-icon ${isActive(path) ? 'text-accent' : 'text-muted'}`}>
            <Icon active={isActive(path)} />
          </span>
          <span className="nav-label">{label}</span>
        </div>
      ))}

      {/* カメラ FABボタン */}
      <div className="flex-1 flex flex-col items-center">
        <button
          onClick={() => navigate('/camera')}
          className="w-14 h-14 rounded-full bg-ink flex items-center justify-center shadow-lg -translate-y-5 border-4 border-paper"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <span className="-mt-3 font-mono text-[10px] tracking-[0.12em] font-semibold text-accent">✦ AIガイド</span>
      </div>

      {/* 右2つ */}
      {RIGHT_ITEMS.map(({ Icon, label, path }) => (
        <div key={path} className={`nav-item ${isActive(path) ? 'active' : ''}`} onClick={() => navigate(path)}>
          <span className={`nav-icon ${isActive(path) ? 'text-accent' : 'text-muted'}`}>
            <Icon active={isActive(path)} />
          </span>
          <span className="nav-label">{label}</span>
        </div>
      ))}
    </nav>
  )
}
