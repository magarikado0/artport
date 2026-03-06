import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../hooks/useAuth'
import { fetchViewingRecords } from '../lib/firestore'

// ジャンルごとの絵文字
const GENRE_SYMBOL = { '書道': '書', '写真': '📷', '陶芸': '🏺', '絵画': '🖼', '彫刻': '🗿' }
const GENRE_BG = {
  '書道': 'linear-gradient(135deg,#e8e0d0,#d4c8b4)',
  '写真': 'linear-gradient(135deg,#d4dce8,#c0ccd8)',
  '陶芸': 'linear-gradient(135deg,#e8ddd4,#d4c4b4)',
  '絵画': 'linear-gradient(135deg,#d4e8d4,#b4d4b4)',
  '彫刻': 'linear-gradient(135deg,#e8d4e0,#d4b4c8)',
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  if (diff < 7) return `${diff}日前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function PortfolioPage() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchViewingRecords(user.uid)
      .then(data => setRecords(data))
      .catch(e => console.error('[Portfolio] 取得エラー:', e))
      .finally(() => setLoading(false))
  }, [user])

  // 統計を計算
  const genres = [...new Set(records.map(r => r.genre).filter(Boolean))]
  const keywords = records
    .map(r => r.summary?.keyword)
    .filter(Boolean)
    .slice(0, 4)

  return (
    <div className="h-screen bg-paper flex flex-col">
      <div className="app-header">
        <span className="app-logo">鑑賞の記録</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Taste card */}
        <div className="px-5 pt-4">
          <div className="bg-ink rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/2" />
            <p className="font-mono text-[9px] tracking-[0.12em] text-accent uppercase mb-2">✦ あなたの感性プロフィール</p>
            {keywords.length > 0 ? (
              <>
                <p className="font-serif text-xl text-paper font-light leading-snug mb-3">
                  {keywords[0]}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw, i) => (
                    <span key={i} className="bg-accent/20 text-accent rounded-full px-2.5 py-1 text-[10px] font-mono">{kw}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="font-serif text-xl text-paper/60 font-light leading-snug">
                作品を鑑賞して記録しましょう
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pt-4 grid grid-cols-3 gap-2.5">
          {[
            { num: records.length, label: '鑑賞記録' },
            { num: records.filter(r => r.type === 'questions').length, label: '質問完了' },
            { num: genres.length, label: 'ジャンル' },
          ].map(s => (
            <div key={s.label} className="bg-warm rounded-xl p-3 text-center">
              <span className="block font-serif text-2xl">{s.num}</span>
              <span className="font-mono text-[8px] text-muted tracking-wide uppercase">{s.label}</span>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="px-5 pt-5 pb-4">
          <p className="section-title">✦ 最近の鑑賞</p>

          {loading && (
            <div className="space-y-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 items-center py-3 border-b border-border">
                  <div className="w-12 h-12 rounded-xl bg-warm animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-warm rounded animate-pulse w-2/3" />
                    <div className="h-2.5 bg-warm rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && records.length === 0 && (
            <div className="text-center py-10">
              <p className="font-mono text-[11px] text-muted">まだ記録がありません</p>
              <p className="font-mono text-[10px] text-muted/60 mt-1">カメラで作品をスキャンして記録しましょう</p>
            </div>
          )}

          {!loading && records.length > 0 && (
            <div className="space-y-0">
              {records.map(r => {
                const genre = r.genre || 'その他'
                const symbol = GENRE_SYMBOL[genre] || '🎨'
                const bg = GENRE_BG[genre] || 'linear-gradient(135deg,#e8e8e8,#d4d4d4)'
                const keyword = r.summary?.keyword || (r.type === 'guide' ? 'ガイド鑑賞' : '質問鑑賞')
                return (
                  <div key={r.id} className="flex gap-3 items-center py-3 border-b border-border cursor-pointer active:bg-warm/60 transition-colors" onClick={() => navigate(`/portfolio/${r.id}`)}>
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt="artwork" className="w-12 h-12 rounded-xl flex-shrink-0 object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl opacity-30"
                        style={{ background: bg }}>{symbol}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-[14px] mb-0.5 truncate">{keyword}</p>
                      <p className="font-mono text-[9px] text-muted">{genre} · {r.type === 'guide' ? 'ガイド' : '質問'}</p>
                    </div>
                    <span className="font-mono text-[9px] text-muted flex-shrink-0">{formatDate(r.createdAt)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
