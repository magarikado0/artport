import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { icon: '⊞', label: 'フィード', path: '/' },
  { icon: '◻', label: '展覧会', path: '/exhibitions' },
  { icon: '＋', label: '投稿', path: '/post' },
  { icon: '◯', label: '記録', path: '/portfolio' },
  { icon: '△', label: 'マイページ', path: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </nav>
  )
}
