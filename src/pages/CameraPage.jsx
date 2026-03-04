import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeImageBase64 } from '../lib/gemini'

const STEPS = ['作品ジャンルを検出', '構図・技法を分析', '鑑賞ガイドを生成中...', '展覧会情報を照合']

export default function CameraPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [state, setState] = useState('camera') // camera | analyzing | result
  const [mode, setMode] = useState('default')  // default | questions
  const [capturedImage, setCapturedImage] = useState(null)
  const [guide, setGuide] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)

  // questions モード用
  const [currentQ, setCurrentQ] = useState(0)        // 現在表示中の問い番号
  const [answers, setAnswers] = useState({})           // { "01": "選択肢A", ... }
  const [revealed, setRevealed] = useState({})         // { "01": true, ... } 解説表示済み

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (e) {
      setError('カメラへのアクセスが許可されていません')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function handleShutter() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Geminiトークン削減のため1200px以内にリサイズ
    const MAX = 1200
    let w = video.videoWidth
    let h = video.videoHeight
    if (w > MAX || h > MAX) {
      const ratio = Math.min(MAX / w, MAX / h)
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)
    }
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(video, 0, 0, w, h)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    console.log(`[CameraPage] キャプチャ: ${video.videoWidth}×${video.videoHeight}px → ${w}×${h}px`)
    setCapturedImage(dataUrl)
    stopCamera()
    setState('analyzing')

    await analyzeImage(dataUrl)
  }

  async function analyzeImage(dataUrl) {
    const base64 = dataUrl.split(',')[1]

    // ステップアニメーション
    for (let i = 0; i < STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 800))
      setCurrentStep(i + 1)
    }

    try {
      const text = await analyzeImageBase64(base64, mode)
      if (!text) throw new Error('no response')

      if (mode === 'default') {
        // プレーンテキストをパース
        const lines = text.split('\n').filter(Boolean)
        const parsed = {
          type: 'default',
          genre: lines.find(l => l.startsWith('ジャンル:'))?.replace('ジャンル:', '').trim() || '不明',
          core: lines.find(l => l.startsWith('核心:'))?.replace('核心:', '').trim() || '',
          points: ['01', '02', '03'].map(n => ({
            num: n,
            text: lines.find(l => l.startsWith(`${n}:`))?.replace(`${n}:`, '').trim() || ''
          })).filter(p => p.text)
        }
        setGuide(parsed)
      } else {
        // JSON をパース
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        setGuide({ type: 'questions', ...parsed })
        setCurrentQ(0)
        setAnswers({})
        setRevealed({})
      }

      setState('result')
    } catch (e) {
      console.error('[CameraPage] analyzeImage error:', e)
      setError('解析に失敗しました。もう一度お試しください。')
      setState('camera')
      startCamera()
    }
  }

  function handleRetake() {
    setState('camera')
    setCapturedImage(null)
    setGuide(null)
    setCurrentStep(0)
    setCurrentQ(0)
    setAnswers({})
    setRevealed({})
    startCamera()
  }

  function handleAnswer(num, option) {
    setAnswers(prev => ({ ...prev, [num]: option }))
  }

  function handleReveal(num) {
    setRevealed(prev => ({ ...prev, [num]: true }))
  }

  function handleNextQ() {
    setCurrentQ(q => q + 1)
  }

  // ── result: questions モードの1問表示
  function renderQuestion(q) {
    const answered = answers[q.num]
    const isRevealed = revealed[q.num]
    const isLast = guide.questions && currentQ === guide.questions.length - 1

    return (
      <div key={q.num} className="guide-card">
        <div className="guide-label">✦ 問い {q.num}</div>
        <div className="guide-text" style={{ fontSize: 17, marginBottom: 14 }}>{q.question}</div>

        {/* 選択肢 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {q.options.map((opt, i) => {
            const isSelected = answered === opt
            return (
              <button
                key={i}
                onClick={() => handleAnswer(q.num, opt)}
                disabled={!!answered}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: isSelected ? '1.5px solid var(--accent)' : '1px solid rgba(0,0,0,0.12)',
                  background: isSelected ? 'rgba(193,127,74,0.08)' : 'rgba(0,0,0,0.03)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  cursor: answered ? 'default' : 'pointer',
                  fontFamily: 'var(--font-serif)',
                  opacity: answered && !isSelected ? 0.45 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* 解説ボタン or 解説 */}
        {answered && !isRevealed && (
          <button
            onClick={() => handleReveal(q.num)}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.08em', border: 'none', cursor: 'pointer', marginBottom: 8
            }}
          >
            解説を見る
          </button>
        )}
        {isRevealed && (
          <div style={{
            background: 'rgba(193,127,74,0.07)', border: '1px solid rgba(193,127,74,0.25)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13,
            color: 'var(--ink)', lineHeight: 1.7, marginBottom: 8
          }}>
            {q.explanation}
          </div>
        )}

        {/* 次へ or 完了 */}
        {isRevealed && (
          isLast ? (
            <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
              ✦ すべての問いに答えました
            </div>
          ) : (
            <button
              onClick={handleNextQ}
              style={{
                width: '100%', padding: '10px', borderRadius: 10,
                background: 'rgba(193,127,74,0.12)', color: 'var(--ink)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.08em', border: '1px solid rgba(193,127,74,0.3)',
                cursor: 'pointer'
              }}
            >
              次の問いへ →
            </button>
          )
        )}
        <div className="guide-ai-badge">✦ Gemini により生成</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── STATE: CAMERA ── */}
      {state === 'camera' && (
        <div className="w-full h-screen relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Scan frame overlay */}
          <div style={s.scanOverlay}>
            {['tl', 'tr', 'bl', 'br'].map(pos => (
              <div key={pos} style={{ ...s.corner, ...s.corners[pos] }} />
            ))}
            <div style={s.scanLine} />
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 pt-[52px] px-5 pb-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
            <button className="w-9 h-9 bg-white/12 border border-white/15 rounded-full text-white" onClick={() => navigate(-1)}>←</button>
            <span className="font-mono text-[11px] tracking-[0.1em] text-white/80 uppercase">✦ 作品をスキャン</span>
            <div className="w-9" />
          </div>

          {/* Instruction */}
          <div className="absolute top-[108px] left-0 right-0 text-center z-10">
            <span className="inline-block bg-accent/15 backdrop-blur-sm border border-accent/30 rounded-full px-4 py-1.5 font-mono text-[10px] text-accent tracking-wider">
              作品を枠内に合わせてください
            </span>
          </div>

          {/* モード切り替えタブ */}
          <div className="absolute top-[148px] left-0 right-0 flex justify-center z-10 mt-3">
            <div style={{
              display: 'flex', gap: 6, background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)', borderRadius: 99, padding: '4px 6px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}>
              {[['default', '📄 説明'], ['questions', '❓ 質問']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setMode(val)}
                  style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: 11,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: mode === val ? 'var(--accent)' : 'transparent',
                    color: mode === val ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontWeight: mode === val ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="absolute bottom-[120px] left-5 right-5 bg-red-600/85 text-white rounded-xl px-4 py-3 text-[13px] text-center">
              {error}
            </div>
          )}

          {/* Bottom */}
          <div className="absolute bottom-0 left-0 right-0 py-6 px-10 pb-12 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent z-10">
            <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/15" />
            <button className="w-[72px] h-[72px] rounded-full bg-white/90 border-[3px] border-white/40 flex items-center justify-center" onClick={handleShutter}>
              <div className="w-[60px] h-[60px] rounded-full bg-white" />
            </button>
            <div className="w-12" />
          </div>
        </div>
      )}

      {/* ── STATE: ANALYZING ── */}
      {state === 'analyzing' && (
        <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-10">
          <div className="w-40 h-[210px] rounded-md mb-8 relative overflow-hidden bg-warm shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div style={s.pulseRing1} />
            <div style={s.pulseRing2} />
            <div style={s.pulseRing3} />
            {capturedImage && (
              <img src={capturedImage} alt="captured" className="w-full h-full object-cover rounded-md" />
            )}
          </div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-accent uppercase mb-3">✦ Gemini が解析中</div>
          <div className="font-serif text-[22px] text-paper font-light mb-1.5">作品を読み解いています</div>
          <div className="text-[12px] text-paper/40 font-mono mb-7">しばらくお待ちください</div>
          <div className="w-[200px] h-0.5 bg-white/10 rounded-sm overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-accent to-[#e8a870] rounded-sm transition-all duration-[600ms] ease-out" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i <= currentStep ? 'bg-accent' : 'bg-white/20'}`}
                  style={{ animation: i === currentStep && i < STEPS.length - 1 ? 'dotPulse 1s ease-in-out infinite' : 'none' }} />
                <span className={`font-mono text-[10px] tracking-wider ${i <= currentStep ? 'text-paper/90' : 'text-paper/30'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATE: RESULT ── */}
      {state === 'result' && guide && (
        <div className="bg-paper min-h-screen">
          {/* Captured image */}
          <div className="w-full h-[280px] relative overflow-hidden bg-warm">
            {capturedImage && (
              <img src={capturedImage} alt="artwork" className="w-full h-full object-cover" />
            )}
            <button className="absolute top-4 left-4 w-9 h-9 bg-paper/85 rounded-full backdrop-blur-sm" onClick={() => navigate(-1)}>←</button>
            <button className="absolute top-4 right-4 bg-paper/85 backdrop-blur-sm rounded-full px-3.5 py-2 font-mono text-[9px] tracking-wider uppercase" onClick={handleRetake}>
              撮り直す
            </button>
            {guide.type === 'default' && (
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-ink/75 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="font-mono text-[9px] text-white/80">作品を検出</span>
                <span className="font-mono text-[9px] text-accent">{guide.genre}</span>
              </div>
            )}
            {guide.type === 'questions' && (
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-ink/75 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-mono text-[9px] text-white/80">❓ 質問モード</span>
                <span className="font-mono text-[9px] text-accent">{currentQ + 1} / {guide.questions?.length ?? 3}</span>
              </div>
            )}
          </div>

          <div className="p-5 pb-[60px]">
            {/* default: ガイド表示 */}
            {guide.type === 'default' && (
              <div className="guide-card">
                <div className="guide-label">✦ AI 鑑賞ガイド</div>
                {guide.core && <div className="guide-text">{guide.core}</div>}
                {guide.points.length > 0 && (
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
              </div>
            )}

            {/* questions: 1問ずつ表示 */}
            {guide.type === 'questions' && guide.questions && (
              renderQuestion(guide.questions[currentQ])
            )}

            {/* Actions */}
            <div className="flex gap-2.5 mt-5">
              <button className="flex-1 py-3 rounded-xl font-mono text-[10px] tracking-wider bg-warm text-ink" onClick={() => navigate('/')}>
                フィードへ
              </button>
              <button className="flex-1 py-3 rounded-xl font-mono text-[10px] tracking-wider bg-ink text-paper" onClick={() => navigate('/exhibitions')}>
                展覧会を見る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  scanOverlay: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '72%', height: '55%',
    pointerEvents: 'none',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: 'var(--accent)', borderStyle: 'solid', borderWidth: 0 },
  corners: {
    tl: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
    tr: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
    br: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5 },
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 1.5,
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    boxShadow: '0 0 8px rgba(193,127,74,0.4)',
    animation: 'scanMove 2.4s ease-in-out infinite',
    top: '50%',
  },
  pulseRing1: { position: 'absolute', inset: -8, borderRadius: 10, border: '1.5px solid rgba(193,127,74,0.4)', animation: 'pulseRing 1.8s ease-out infinite' },
  pulseRing2: { position: 'absolute', inset: -16, borderRadius: 14, border: '1.5px solid rgba(193,127,74,0.25)', animation: 'pulseRing 1.8s ease-out infinite', animationDelay: '0.4s' },
  pulseRing3: { position: 'absolute', inset: -24, borderRadius: 18, border: '1.5px solid rgba(193,127,74,0.12)', animation: 'pulseRing 1.8s ease-out infinite', animationDelay: '0.8s' },
}
