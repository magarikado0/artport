import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { fetchExhibitions } from '../lib/firestore'

const FILTERS = ['開催中', '近日開催', '書道', '写真', '陶芸']
const DEMO = [
  { id: '1', title: '東大書道部 春季展覧会', venue: '東京大学 本郷キャンパス 山上会館', genre: ['書道'], startDate: {toDate:()=>new Date('2026-03-10')}, endDate: {toDate:()=>new Date('2026-03-15')}, artworkCount: 24, status: '開催中', coverBg: 'linear-gradient(135deg,#e8e0d0,#d4c8b4)', symbol: '書' },
  { id: '2', title: '光の記憶 — 写真展 2026', venue: '早稲田大学 大隈記念館', genre: ['写真'], startDate: {toDate:()=>new Date('2026-03-08')}, endDate: {toDate:()=>new Date('2026-03-14')}, artworkCount: 38, status: '開催中', coverBg: 'linear-gradient(135deg,#d4dce8,#c0ccd8)', symbol: '📷' },
  { id: '3', title: '土と声 — 陶芸作品展', venue: '多摩美術大学 芸術祭会場', genre: ['陶芸'], startDate: {toDate:()=>new Date('2026-03-20')}, endDate: {toDate:()=>new Date('2026-03-25')}, artworkCount: 16, status: '近日開催', coverBg: 'linear-gradient(135deg,#e8ddd4,#d4c4b4)', symbol: '🏺' },
]

export default function ExhibitionsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('開催中')
  const [exhibitions, setExhibitions] = useState([])

  useEffect(() => {
    fetchExhibitions().then(setExhibitions).catch(console.error)
  }, [])

  function fmtDate(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return `${d.getMonth()+1}/${d.getDate()}`
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="app-header">
        <span className="app-logo">展覧会</span>
        <button className="w-9 h-9 bg-warm rounded-full flex items-center justify-center">🔍</button>
      </div>

      <div className="flex gap-2 px-4 pt-3 overflow-x-auto [scrollbar-width:none]">
        {FILTERS.map(f => (
          <button key={f} className={`filter-tab ${activeFilter===f?'active':''}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="flex-1 p-4 space-y-3">
        {exhibitions.map(ex => (
          <div key={ex.id} className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onClick={() => navigate(`/exhibitions/${ex.id}`)}>
            <div className="w-full h-40 flex items-center justify-center text-5xl"
              style={{background: ex.coverBg || 'linear-gradient(135deg,#e8e0d0,#d4c8b4)'}}>
              {ex.symbol || ex.coverUrl
                ? ex.coverUrl ? <img src={ex.coverUrl} className="w-full h-full object-cover" /> : ex.symbol
                : '🖼'}
            </div>
            <div className="p-4">
              <div className="flex gap-2 flex-wrap mb-2">
                {(ex.genre||[]).map(g => <span key={g} className="genre-tag">{g}</span>)}
                <span className={`genre-tag ${ex.status==='開催中'?'!bg-green-50 !text-green-600':'!bg-orange-50 !text-orange-500'}`}>
                  {ex.status || '開催中'}
                </span>
              </div>
              <h3 className="font-serif text-[18px] mb-1">{ex.title}</h3>
              <p className="font-mono text-[10px] text-muted mb-3">📍 {ex.venue}</p>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-muted">
                  {fmtDate(ex.startDate)} – {fmtDate(ex.endDate)}
                </span>
                <span className="font-mono text-[10px] text-accent">
                  作品 {ex.artworkCount || 0}点
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Create button */}
        <button
          onClick={() => navigate('/exhibitions/create')}
          className="w-full py-4 border-2 border-dashed border-border rounded-2xl font-mono text-[11px] text-muted tracking-wide bg-transparent cursor-pointer"
        >
          ＋ 展覧会を作成する
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
