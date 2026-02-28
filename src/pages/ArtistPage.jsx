import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { fetchUserProfile, fetchArtworksByArtist } from '../lib/firestore'

const DEMO_ARTIST = { name: '山田 碧', genre: '書道', bio: '東京大学書道部所属。余白と静寂をテーマに制作。古典臨書と現代的表現の融合を探求しています。' }
const BG = ['linear-gradient(135deg,#e8e0d0,#d4c8b4)','linear-gradient(135deg,#d4dce8,#c0ccd8)','linear-gradient(135deg,#e8ddd4,#d4c4b4)']

export default function ArtistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artist, setArtist] = useState(null)
  const [artworks, setArtworks] = useState([])

  useEffect(() => {
    Promise.all([fetchUserProfile(id), fetchArtworksByArtist(id)])
      .then(([a, ws]) => { setArtist(a || DEMO_ARTIST); setArtworks(ws) })
      .catch(() => { setArtist(DEMO_ARTIST); setArtworks([]) })
  }, [id])

  if (!artist) return <div className="min-h-screen bg-paper flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="px-5 pt-6 pb-4 bg-paper border-b border-border text-center">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-warm rounded-full flex items-center justify-center text-sm">←</button>
        <div className="w-[72px] h-[72px] rounded-full bg-warm mx-auto mb-3 flex items-center justify-center text-3xl border-[3px] border-paper shadow-[0_0_0_2px_#d4ccc2]">
          {artist.avatarUrl ? <img src={artist.avatarUrl} className="w-full h-full rounded-full object-cover" /> : '🖌'}
        </div>
        <h1 className="font-serif text-[22px] mb-1">{artist.name}</h1>
        <p className="font-mono text-[10px] text-accent tracking-wider uppercase mb-2.5">{artist.genre}</p>
        <p className="text-[12px] text-muted leading-relaxed max-w-[280px] mx-auto mb-3.5">{artist.bio}</p>
        <div className="flex justify-center gap-6">
          {[{num:artworks.length||'24',label:'作品'},{num:'3',label:'展覧会'},{num:'142',label:'鑑賞者'}].map(s => (
            <div key={s.label}>
              <span className="block font-serif text-xl text-center">{s.num}</span>
              <span className="font-mono text-[9px] text-muted tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0.5 bg-paper">
        {(artworks.length ? artworks : Array(6).fill(null)).map((a, i) => (
          <div key={i} className="aspect-square flex items-center justify-center text-2xl opacity-20 cursor-pointer"
            style={{background: BG[i%3]}}>
            {a?.imageUrl ? <img src={a.imageUrl} className="w-full h-full object-cover" /> : '書'}
          </div>
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav />
    </div>
  )
}
