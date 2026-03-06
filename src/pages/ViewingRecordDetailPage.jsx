import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchViewingRecord } from '../lib/firestore'
import BottomNav from '../components/layout/BottomNav'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export default function ViewingRecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchViewingRecord(user.uid, id)
      .then(data => setRecord(data))
      .catch(e => console.error('[RecordDetail] 取得エラー:', e))
      .finally(() => setLoading(false))
  }, [user, id])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-8 gap-4">
        <p className="font-mono text-[12px] text-muted">記録が見つかりません</p>
        <button className="btn-secondary" onClick={() => navigate('/portfolio')}>戻る</button>
      </div>
    )
  }

  const isGuide = record.type === 'guide'
  const isQuestions = record.type === 'questions'

  return (
    <div className="bg-paper min-h-screen">
      {/* 作品画像 */}
      <div className="w-full h-[280px] relative overflow-hidden bg-warm">
        {record.imageUrl ? (
          <img src={record.imageUrl} alt="artwork" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-warm" />
        )}
        <button
          className="absolute top-4 left-4 w-9 h-9 bg-paper/85 rounded-full backdrop-blur-sm flex items-center justify-center"
          onClick={() => navigate('/portfolio')}
        >
          ←
        </button>
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-ink/75 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="font-mono text-[9px] text-white/80">{record.genre}</span>
          <span className="font-mono text-[9px] text-paper/40">{formatDate(record.createdAt)}</span>
        </div>
      </div>

      <div className="p-5 pb-[100px]">
        {/* ── ガイド鑑賞 ── */}
        {isGuide && record.guide && (
          <>
            <div className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase mb-1">❖ 鑑賞記録</div>
            <div className="font-serif text-[22px] text-ink font-light mb-5">AI 鑑賞ガイド</div>
            <div className="guide-card">
              <div className="guide-label">✦ AI 鑑賞ガイド</div>
              {record.guide.core && <div className="guide-text">{record.guide.core}</div>}
              {record.guide.points?.length > 0 && (
                <div className="guide-points">
                  {record.guide.points.map(p => (
                    <div className="guide-point" key={p.num}>
                      <span className="guide-point-num">{p.num}</span>
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 質問鑑賞 ── */}
        {isQuestions && (
          <>
            <div className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase mb-1">❖ 鑑賞記録</div>
            <div className="font-serif text-[22px] text-ink font-light mb-5">鑑賞の足跡</div>

            {/* あなたの鑑賞まとめ */}
            {record.summary?.message && (
              <div className="guide-card mb-5">
                <div className="guide-label">✦ あなたの鑑賞まとめ</div>
                {record.summary.keyword && (
                  <div className="font-serif text-[22px] text-paper font-light leading-snug mb-3">
                    {record.summary.keyword}
                  </div>
                )}
                <div className="flex flex-col gap-2.5 mt-1">
                  {record.summary.message.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="font-sans text-[15px] leading-relaxed text-paper/90 font-light">{line}</div>
                  ))}
                </div>
              </div>
            )}

            {/* AI鑑賞ガイド */}
            {record.summary?.guide && (
              <div className="guide-card mb-6">
                <div className="guide-label">❖ AI 鑑賞ガイド</div>
                {record.summary.guide.core && (
                  <div className="guide-text">{record.summary.guide.core}</div>
                )}
                {record.summary.guide.points?.length > 0 && (
                  <div className="guide-points">
                    {record.summary.guide.points.map(p => (
                      <div className="guide-point" key={p.num}>
                        <span className="guide-point-num">{p.num}</span>
                        <span>{p.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Q&A 振り返り */}
            {record.questions?.length > 0 && (
              <>
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase mb-3">□ 質問の振り返り</p>
                <div className="flex flex-col gap-3">
                  {record.questions.map((q, i) => {
                    const ans = record.answers?.[i]
                    return (
                      <div key={q.num} className="rounded-2xl border border-border overflow-hidden">
                        <div className="flex items-start gap-3 bg-warm px-4 py-3">
                          <span className="font-mono text-[10px] text-accent font-bold flex-shrink-0 mt-0.5">{q.num}</span>
                          <span className="font-sans text-[13px] text-ink leading-snug">{q.text}</span>
                        </div>
                        {(ans?.choice || ans?.freeText) && (
                          <div className="bg-paper px-4 py-2 border-t border-border">
                            {ans.choice && <span className="font-sans text-[12px] text-muted">› {ans.choice}</span>}
                            {ans.freeText && <p className="font-sans text-[11px] text-muted/70 italic mt-0.5">{ans.freeText}</p>}
                          </div>
                        )}
                        <div className="bg-ink/95 px-4 py-2 border-t border-accent/20">
                          <span className="font-mono text-[9px] text-accent mr-1">✦</span>
                          <span className="font-sans text-[11px] text-paper/75">{q.explanation}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
