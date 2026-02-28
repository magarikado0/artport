import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { fetchExhibition } from '../lib/firestore'

const DEMO = {
  id: '1', title: '東大書道部 春季展覧会', venue: '東京大学 本郷キャンパス 山上会館',
  genre: ['書道'], startDate: {toDate:()=>new Date('2026-03-10')}, endDate: {toDate:()=>new Date('2026-03-15')},
  openTime: '10:00', closeTime: '18:00', admission: '無料',
  description: '東京大学書道部による春季展覧会。部員24名が一年間の制作活動の集大成を発表します。臨書から創作まで、多様な表現をご覧いただけます。',
  artworkCount: 24, symbol: '書', coverBg: 'linear-gradient(135deg,#2a2420,#3d3028)',
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return `${d.getMonth()+1}月${d.getDate()}日`
}

export default function ExhibitionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ex, setEx] = useState(null)

  useEffect(() => {
    fetchExhibition(id).then(d => setEx(d || DEMO)).catch(() => setEx(DEMO))
  }, [id])

  if (!ex) return <div className="min-h-screen bg-paper flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Hero */}
      <div className="relative h-56 flex items-end p-5" style={{background: ex.coverBg || 'linear-gradient(135deg,#2a2420,#3d3028)'}}>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-paper/80 backdrop-blur rounded-full flex items-center justify-center text-sm">←</button>
        <div className="text-paper">
          <p className="font-mono text-[9px] tracking-[0.12em] text-accent uppercase mb-1.5">
            {(ex.genre||[]).join(' · ')} · {ex.status || '開催中'}
          </p>
          <h1 className="font-serif text-[26px] font-light leading-tight mb-1">{ex.title}</h1>
          <p className="font-mono text-[11px] text-paper/60">{ex.venue}</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">
        {/* Info chips */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: '会期', value: `${fmtDate(ex.startDate)} – ${fmtDate(ex.endDate)}` },
            { label: '時間', value: `${ex.openTime||'10:00'}–${ex.closeTime||'18:00'}` },
            { label: '入場', value: ex.admission || '無料' },
          ].map(chip => (
            <div key={chip.label} className="bg-warm rounded-xl p-3">
              <p className="font-mono text-[8px] tracking-wider text-muted uppercase mb-1">{chip.label}</p>
              <p className="text-[11px] font-medium">{chip.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-[12px] leading-[1.9] text-[#4a4440]">{ex.description}</p>

        {/* Artworks */}
        <div>
          <p className="section-title">✦ 出展作品</p>
          <div className="grid grid-cols-3 gap-1.5">
            {Array(ex.artworkCount ? Math.min(ex.artworkCount, 9) : 6).fill(0).map((_,i) => (
              <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-2xl opacity-20"
                style={{background:'linear-gradient(135deg,#e8e0d0,#d4c8b4)'}}>
                {ex.symbol || '書'}
              </div>
            ))}
          </div>
        </div>

        <button className="btn-secondary">＋ 気になるリストに追加</button>
      </div>

      <BottomNav />
    </div>
  )
}
