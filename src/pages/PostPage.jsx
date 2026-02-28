import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import { createArtwork } from '../lib/firestore'
import { useAuth } from '../hooks/useAuth'

const GENRES = ['書道', '写真', '陶芸', '絵画', '彫刻', 'その他']

export default function PostPage() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [form, setForm] = useState({ title: '', genre: '書道', exhibitionId: '' })
  const [saving, setSaving] = useState(false)

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!user || !form.title || !imageFile) return
    setSaving(true)
    try {
      await createArtwork({
        ...form,
        artistId: user.uid,
        artistName: userProfile?.name || user.displayName || '',
      }, imageFile)
      navigate('/')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="app-header">
        <span className="app-logo">作品を投稿</span>
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-warm rounded-full flex items-center justify-center">✕</button>
      </div>

      <div className="flex-1 p-5 space-y-4 pb-32">
        {/* Image upload */}
        <label className="relative block w-full h-52 border-2 border-dashed border-border rounded-2xl bg-warm flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden">
          {imagePreview
            ? <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" />
            : <>
                <span className="text-3xl opacity-30">＋</span>
                <span className="text-[13px] text-muted">作品画像をアップロード</span>
                <span className="font-mono text-[9px] text-border tracking-wide">JPG / PNG · 最大10MB</span>
              </>
          }
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        {/* Title */}
        <div>
          <label className="form-label">作品タイトル</label>
          <input className="form-input" placeholder="例：静寂の筆跡" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
        </div>

        {/* Genre */}
        <div>
          <label className="form-label">ジャンル</label>
          <select className="form-select" value={form.genre} onChange={e => setForm(p=>({...p,genre:e.target.value}))}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        {/* AI preview hint */}
        <div className="bg-ink rounded-2xl p-4">
          <p className="font-mono text-[9px] tracking-wider text-accent uppercase mb-2">✦ AI 鑑賞ガイド</p>
          <p className="text-[12px] text-paper/60 leading-relaxed">
            作品を投稿すると、Gemini が自動で鑑賞ガイドを生成します。作品を見たことのない人が興味を持てるような解説が生成されます。
          </p>
        </div>

        <button onClick={handleSubmit} disabled={saving || !form.title || !imageFile}
          className="btn-primary disabled:opacity-40">
          {saving ? '投稿中...' : '投稿する'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
