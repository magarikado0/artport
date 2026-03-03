import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { createExhibition } from '../lib/firestore'
import { useAuth } from '../hooks/useAuth'

const GENRES_ALL = ['書道', '写真', '陶芸', '絵画', '彫刻', 'その他']

export default function ExhibitionCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [selectedGenres, setSelectedGenres] = useState([])
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', openTime: '10:00', closeTime: '18:00', venue: '', address: '', admission: '無料', description: '' })
  const [saving, setSaving] = useState(false)

  function toggleGenre(g) {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function handleCover(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(isDraft = false) {
    if (!user) return
    setSaving(true)
    try {
      await createExhibition({
        ...form,
        genre: selectedGenres,
        artistId: user.uid,
        isDraft,
        artworkIds: [],
        status: isDraft ? 'draft' : '近日開催',
      }, coverFile)
      navigate('/exhibitions')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="app-header">
        <span className="app-logo">展覧会を作成</span>
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-warm rounded-full flex items-center justify-center">✕</button>
      </div>

      <div className="flex-1 p-5 space-y-4 pb-32">
        {/* Cover */}
        <label className="block relative w-full h-40 border-2 border-dashed border-border rounded-2xl bg-warm flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden">
          {coverPreview
            ? <img src={coverPreview} className="absolute inset-0 w-full h-full object-cover" />
            : <>
                <span className="text-3xl opacity-30">🖼</span>
                <span className="text-[13px] text-muted">展覧会のカバー画像を追加</span>
                <span className="font-mono text-[9px] text-border tracking-wide">JPG / PNG · 推奨 1920×1080</span>
              </>
          }
          <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
        </label>

        {/* Title */}
        <div>
          <label className="form-label">展覧会タイトル</label>
          <input className="form-input" placeholder="例：東大書道部 春季展覧会" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
        </div>

        {/* Genre */}
        <div>
          <label className="form-label">ジャンル（複数選択可）</label>
          <div className="flex flex-wrap gap-2">
            {GENRES_ALL.map(g => (
              <button key={g} type="button"
                className={`px-3.5 py-2 rounded-full border font-mono text-[10px] tracking-wide cursor-pointer transition-all ${selectedGenres.includes(g) ? 'bg-ink border-ink text-paper' : 'bg-warm border-border text-muted'}`}
                onClick={() => toggleGenre(g)}>{g}</button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="form-label">開始日</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(p=>({...p,startDate:e.target.value}))} />
          </div>
          <div>
            <label className="form-label">終了日</label>
            <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(p=>({...p,endDate:e.target.value}))} />
          </div>
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="form-label">開館時間</label>
            <input className="form-input" type="time" value={form.openTime} onChange={e => setForm(p=>({...p,openTime:e.target.value}))} />
          </div>
          <div>
            <label className="form-label">閉館時間</label>
            <input className="form-input" type="time" value={form.closeTime} onChange={e => setForm(p=>({...p,closeTime:e.target.value}))} />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="form-label">会場名</label>
          <input className="form-input" placeholder="例：山上会館 2F ギャラリー" value={form.venue} onChange={e => setForm(p=>({...p,venue:e.target.value}))} />
        </div>

        <div>
          <label className="form-label">住所</label>
          <input className="form-input" placeholder="例：東京都文京区本郷7-3-1" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
        </div>

        {/* Admission */}
        <div>
          <label className="form-label">入場料</label>
          <select className="form-select" value={form.admission} onChange={e => setForm(p=>({...p,admission:e.target.value}))}>
            <option>無料</option><option>有料</option><option>任意（カンパ）</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="form-label">展覧会の説明</label>
          <textarea className="form-input" rows={4} style={{resize:'none',lineHeight:'1.7'}}
            placeholder="展覧会のテーマや見どころを書いてください"
            value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
        </div>

        {/* Actions */}
        <button onClick={() => handleSubmit(false)} disabled={saving}
          className="btn-primary disabled:opacity-50">
          {saving ? '公開中...' : '公開する'}
        </button>
        <button onClick={() => handleSubmit(true)} disabled={saving} className="btn-secondary">
          下書き保存
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
