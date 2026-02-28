import { useState } from 'react'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../hooks/useAuth'

const HISTORY = [
  { title: '静寂の筆跡', artist: '山田 碧', genre: '書道', date: '今日', bg: 'linear-gradient(135deg,#e8e0d0,#d4c8b4)', symbol: '書' },
  { title: '霧の朝', artist: '田中 光', genre: '写真', date: '昨日', bg: 'linear-gradient(135deg,#d4dce8,#c0ccd8)', symbol: '📷' },
  { title: '白磁の静', artist: '鈴木 陶子', genre: '陶芸', date: '2日前', bg: 'linear-gradient(135deg,#e8ddd4,#d4c4b4)', symbol: '🏺' },
]

export default function PortfolioPage() {
  const { userProfile } = useAuth()
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="app-header">
        <span className="app-logo">鑑賞の記録</span>
      </div>

      {/* Taste card */}
      <div className="px-5 pt-4">
        <div className="bg-ink rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/2" />
          <p className="font-mono text-[9px] tracking-[0.12em] text-accent uppercase mb-2">✦ あなたの感性プロフィール</p>
          <p className="font-serif text-xl text-paper font-light leading-snug mb-3">
            余白と静寂に<br/>惹かれる鑑賞者
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['余白', '静寂', 'モノクロ', '伝統'].map(t => (
              <span key={t} className="bg-accent/20 text-accent rounded-full px-2.5 py-1 text-[10px] font-mono">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pt-4 grid grid-cols-3 gap-2.5">
        {[{num:'47',label:'鑑賞作品'},{num:'8',label:'訪問展覧会'},{num:'4',label:'ジャンル'}].map(s => (
          <div key={s.label} className="bg-warm rounded-xl p-3 text-center">
            <span className="block font-serif text-2xl">{s.num}</span>
            <span className="font-mono text-[8px] text-muted tracking-wide uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="px-5 pt-5">
        <p className="section-title">✦ 最近見た作品</p>
        <div className="space-y-0">
          {HISTORY.map((h,i) => (
            <div key={i} className="flex gap-3 items-center py-3 border-b border-border">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl opacity-25"
                style={{background:h.bg}}>{h.symbol}</div>
              <div className="flex-1">
                <p className="font-serif text-[14px] mb-0.5">{h.title}</p>
                <p className="font-mono text-[9px] text-muted">{h.artist} · {h.genre}</p>
              </div>
              <span className="font-mono text-[9px] text-muted">{h.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav />
    </div>
  )
}
