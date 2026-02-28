import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateViewingGuide } from '../lib/gemini'

export default function ArtworkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artwork, setArtwork] = useState(null)
  const [guide, setGuide] = useState(null)
  const [guideLoading, setGuideLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchArtwork()
  }, [id])

  async function fetchArtwork() {
    try {
      const snap = await getDoc(doc(db, 'artworks', id))
      if (!snap.exists()) { navigate('/'); return }
      const data = { id: snap.id, ...snap.data() }
      setArtwork(data)

      // キャッシュ済みガイドがあればそのまま使う
      if (data.guide) {
        setGuide(data.guide)
      } else {
        generateGuide(data)
      }
    } catch (e) {
      setError('作品の読み込みに失敗しました')
    }
  }

  async function generateGuide(data) {
    if (!data.imageUrl) return
    setGuideLoading(true)
    try {
      const result = await generateViewingGuide(data.imageUrl, data.genre, data.title)
      setGuide(result)
      // Firestoreにキャッシュ保存
      await updateDoc(doc(db, 'artworks', id), { guide: result })
    } catch (e) {
      console.error('Guide generation failed:', e)
    } finally {
      setGuideLoading(false)
    }
  }

  if (!artwork) {
    return (
      <div className="loading-screen">
        <div className="dot-pulse"><span /><span /><span /></div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero image */}
      <div style={styles.hero}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        {artwork.imageUrl ? (
          <img src={artwork.imageUrl} alt={artwork.title} style={styles.heroImg} />
        ) : (
          <div style={{ ...styles.heroPlaceholder }}>
            <span style={styles.heroChar}>{artwork.genre === '書道' ? '書' : '✦'}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Title row */}
        <div style={styles.titleRow}>
          <div>
            <div style={styles.title}>{artwork.title}</div>
            <div style={styles.artist}
              onClick={() => artwork.artistId && navigate(`/artist/${artwork.artistId}`)}
            >
              {artwork.artistName} — {artwork.genre}
            </div>
          </div>
          <span className="genre-tag">{artwork.genre}</span>
        </div>

        {/* AI Guide */}
        <div className="guide-card">
          <div className="guide-label">✦ AI 鑑賞ガイド</div>
          {guideLoading ? (
            <GuideLoading />
          ) : guide ? (
            <>
              {guide.core && <div className="guide-text">{guide.core}</div>}
              {guide.points?.length > 0 && (
                <div className="guide-points">
                  {guide.points.map(p => (
                    <div className="guide-point" key={p.num}>
                      <span className="guide-point-num">{p.num}</span>
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="guide-ai-badge">✦ Gemini により生成</div>
            </>
          ) : (
            <div className="guide-text" style={{ opacity: 0.5 }}>
              ガイドを生成できませんでした
            </div>
          )}
        </div>

        {/* Exhibition link */}
        {artwork.exhibitionId && (
          <ExhibitionLink
            exhibitionId={artwork.exhibitionId}
            onClick={() => navigate(`/exhibitions/${artwork.exhibitionId}`)}
          />
        )}

        {/* Error */}
        {error && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  )
}

function GuideLoading() {
  const steps = ['作品ジャンルを検出', '構図・技法を分析', '鑑賞ガイドを生成中...']
  return (
    <div style={{ paddingTop: 4 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i < 2 ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
            flexShrink: 0,
            animation: i === 2 ? 'dotPulse 1s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: i < 2 ? 'rgba(247,244,239,0.5)' : 'rgba(247,244,239,0.9)',
            letterSpacing: '0.06em',
          }}>{s}</span>
        </div>
      ))}
    </div>
  )
}

function ExhibitionLink({ exhibitionId, onClick }) {
  const [exhibition, setExhibition] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'exhibitions', exhibitionId)).then(snap => {
      if (snap.exists()) setExhibition({ id: snap.id, ...snap.data() })
    })
  }, [exhibitionId])

  if (!exhibition) return null

  const start = exhibition.startDate?.toDate?.()?.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) || ''
  const end = exhibition.endDate?.toDate?.()?.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) || ''

  return (
    <div style={styles.exLink} onClick={onClick}>
      <div>
        <div style={styles.exLinkLabel}>📍 展覧会</div>
        <div style={styles.exLinkTitle}>{exhibition.title}</div>
        <div style={styles.exLinkDate}>{start} – {end} · {exhibition.venue}</div>
      </div>
      <button style={styles.ctaBtn}>行く →</button>
    </div>
  )
}

const styles = {
  hero: {
    width: '100%',
    aspectRatio: '3/4',
    background: 'linear-gradient(160deg, #e8e0d0, #d4c8b8)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroChar: {
    fontFamily: 'var(--font-serif)',
    fontSize: 120,
    color: 'rgba(26,22,18,0.1)',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    background: 'rgba(247,244,239,0.9)',
    border: 'none',
    borderRadius: '50%',
    fontSize: 16,
    backdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  body: {
    padding: '20px 20px 100px',
    background: 'var(--paper)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 24,
    fontWeight: 400,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  artist: {
    fontSize: 12,
    color: 'var(--muted)',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  exLink: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    gap: 12,
  },
  exLinkLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  exLinkTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 2,
  },
  exLinkDate: {
    fontSize: 11,
    color: 'var(--muted)',
  },
  ctaBtn: {
    background: 'var(--accent)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap',
  },
}
