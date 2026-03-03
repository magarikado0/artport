import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { fetchArtworks } from '../lib/firestore'

const GENRES = ['すべて', '書道', '写真', '陶芸', '絵画', '彫刻']
const DEMO = [
  { id: '1', title: '静寂の筆跡', artistName: '山田 碧', genre: '書道', imageUrl: '', exhibitionTitle: '東大書道部 春季展', tall: true },
  { id: '2', title: '光の記憶', artistName: '田中 光', genre: '写真', imageUrl: '' },
  { id: '3', title: '器の声', artistName: '鈴木 陶子', genre: '陶芸', imageUrl: '' },
  { id: '4', title: '春の余白', artistName: '中村 彩', genre: '絵画', imageUrl: '', tall: true },
  { id: '5', title: '風の形', artistName: '佐藤 玄', genre: '書道', imageUrl: '' },
  { id: '6', title: '霧の朝', artistName: '伊藤 朝', genre: '写真', imageUrl: '' },
]
const SYMBOLS = { '書道': '書', '写真': '📷', '陶芸': '🏺', '絵画': '🎨', '彫刻': '🗿' }
const BG = {
  '書道': 'linear-gradient(135deg,#f0ece4,#e4ddd4)',
  '写真': 'linear-gradient(135deg,#d4dce8,#c8d4e0)',
  '陶芸': 'linear-gradient(135deg,#e8ddd4,#d4c8bc)',
  '絵画': 'linear-gradient(135deg,#dce4d4,#c8d4c0)',
  '彫刻': 'linear-gradient(135deg,#e4dce8,#d4c8dc)',
}

export default function FeedPage() {
  const navigate = useNavigate()
  const [activeGenre, setActiveGenre] = useState('すべて')
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [activeGenre])

  async function load() {
    setLoading(true)
    try {
      const genre = activeGenre === 'すべて' ? null : activeGenre
      const data = await fetchArtworks(genre)
      setArtworks(data)
    } catch (e) {
      console.error('Error loading artworks:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-paper flex flex-col">
      <div className="app-header">
        <span className="app-logo">Art<span className="text-accent">port</span></span>
      </div>

      <div className="flex gap-2 px-4 pt-3 overflow-x-auto [scrollbar-width:none]">
        {GENRES.map(g => (
          <button key={g} className={`filter-tab ${activeGenre===g?'active':''}`} onClick={() => setActiveGenre(g)}>{g}</button>
        ))}
      </div>

      <div className="flex-1 p-3 grid grid-cols-2 gap-2.5 content-start overflow-y-auto">
        {loading
          ? Array(6).fill(0).map((_,i) => (
              <div key={i} className={`artwork-card animate-pulse ${i%5===0?'row-span-2':''}`}>
                <div className="bg-warm" style={{aspectRatio: i%5===0?'1/1.6':'1'}} />
              </div>
            ))
          : artworks.map((a,i) => {
              const tall = a.tall || i%5===0
              return (
                <div key={a.id} className={`artwork-card ${tall?'row-span-2':''}`} onClick={() => navigate(`/artworks/${a.id}`)}>
                  <div className="w-full overflow-hidden flex items-center justify-center"
                    style={{aspectRatio: tall?'1/1.6':'1', background: BG[a.genre]||'linear-gradient(135deg,#e8e0d4,#d4ccc0)'}}>
                    {a.imageUrl
                      ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-contain" />
                      : <span className="text-5xl opacity-10 font-serif">{SYMBOLS[a.genre]||'🎨'}</span>
                    }
                  </div>
                  <div className="p-2.5 pb-3">
                    <p className="font-serif text-[13px] font-medium leading-tight mb-0.5">{a.title}</p>
                    <p className="font-mono text-[10px] text-muted mb-1.5">{a.artistName}</p>
                    <span className="genre-tag">{a.genre}</span>
                  </div>
                </div>
              )
            })
        }
      </div>

      <BottomNav />
    </div>
  )
}
