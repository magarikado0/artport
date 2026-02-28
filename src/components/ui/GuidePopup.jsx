import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateViewingGuide } from '../../lib/gemini'
import { saveArtworkGuide } from '../../lib/firestore'

export default function GuidePopup({ artwork, onClose }) {
  const navigate = useNavigate()
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!artwork) return
    if (artwork.guide) {
      // キャッシュあり
      try {
        setGuide(typeof artwork.guide === 'string' ? JSON.parse(artwork.guide) : artwork.guide)
      } catch {
        loadGuide()
      }
    } else {
      loadGuide()
    }
  }, [artwork])

  async function loadGuide() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateViewingGuide(
        artwork.imageUrl,
        artwork.genre,
        artwork.title
      )
      setGuide(result)
      // Firestoreにキャッシュ保存
      await saveArtworkGuide(artwork.id, JSON.stringify(result))
    } catch (e) {
      setError('ガイドの生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!artwork) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* sheet */}
      <div
        className="relative w-full max-w-md bg-paper rounded-t-3xl overflow-y-auto max-h-[90vh] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* artwork image */}
        <div className="relative w-full h-56 bg-warm overflow-hidden">
          {artwork.imageUrl ? (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-10">
              {artwork.genre === '書道' ? '書' : '🎨'}
            </div>
          )}
          {/* close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-paper/80 backdrop-blur rounded-full flex items-center justify-center text-sm"
          >
            ✕
          </button>
          {/* genre badge */}
          <div className="absolute bottom-3 left-3">
            <span className="genre-tag">{artwork.genre}</span>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* title */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl leading-tight mb-1">{artwork.title}</h2>
              <p className="font-mono text-[10px] text-muted">{artwork.artistName}</p>
            </div>
            <button className="w-9 h-9 bg-warm rounded-full flex items-center justify-center text-lg flex-shrink-0">
              ♡
            </button>
          </div>

          {/* AI Guide */}
          <div className="guide-card">
            <div className="guide-label">
              <span>✦</span>
              <span>AI 鑑賞ガイド</span>
              {loading && (
                <span className="flex gap-1 ml-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-accent animate-blink"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </span>
              )}
            </div>

            {loading && (
              <div className="space-y-4">
                {/* analyzing steps */}
                {[
                  { label: '作品ジャンルを検出', done: true },
                  { label: '構図・技法を分析', done: true },
                  { label: '鑑賞ガイドを生成中...', done: false, active: true },
                  { label: '展覧会情報を照合', done: false },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-2 font-mono text-[9px] tracking-wide">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        step.done
                          ? 'bg-accent'
                          : step.active
                          ? 'bg-accent animate-blink'
                          : 'bg-white/20'
                      }`}
                    />
                    <span
                      className={
                        step.done
                          ? 'text-paper/50'
                          : step.active
                          ? 'text-paper/90'
                          : 'text-paper/25'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
                <div className="w-full h-0.5 bg-white/10 rounded overflow-hidden">
                  <div className="h-full bg-accent animate-progress rounded" />
                </div>
              </div>
            )}

            {error && (
              <p className="guide-text text-red-400">{error}</p>
            )}

            {guide && !loading && (
              <>
                <p className="guide-text mb-3">{guide.core}</p>
                <div className="space-y-2">
                  {guide.points?.map((p) => (
                    <div key={p.num} className="flex gap-2 items-start">
                      <span className="font-mono text-[9px] text-accent mt-0.5 flex-shrink-0">
                        {p.num}
                      </span>
                      <span className="text-[12px] text-paper/75 leading-relaxed">
                        {p.text}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-accent/15 rounded-full px-2.5 py-1 font-mono text-[9px] text-accent tracking-wide">
                  ✦ Gemini により生成
                </div>
              </>
            )}
          </div>

          {/* Exhibition link */}
          {artwork.exhibitionId && (
            <div
              className="bg-white border border-border rounded-2xl p-3.5 flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => {
                onClose()
                navigate(`/exhibitions/${artwork.exhibitionId}`)
              }}
            >
              <div>
                <p className="font-mono text-[8px] text-muted tracking-widest uppercase mb-1">
                  📍 展覧会
                </p>
                <p className="font-serif text-base">{artwork.exhibitionTitle || '展覧会を見る'}</p>
              </div>
              <button className="bg-accent text-white text-[11px] font-mono rounded-full px-4 py-2 flex-shrink-0">
                行く →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
