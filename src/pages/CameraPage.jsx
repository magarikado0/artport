import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = ['作品ジャンルを検出', '構図・技法を分析', '鑑賞ガイドを生成中...', '展覧会情報を照合']

export default function CameraPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [state, setState] = useState('camera') // camera | analyzing | result
  const [capturedImage, setCapturedImage] = useState(null)
  const [guide, setGuide] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)

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

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
    setState('analyzing')

    await analyzeWithGemini(dataUrl)
  }

  async function analyzeWithGemini(dataUrl) {
    const base64 = dataUrl.split(',')[1]
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

    // ステップアニメーション
    for (let i = 0; i < STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 800))
      setCurrentStep(i + 1)
    }

    try {
      const prompt = `この作品画像を見て以下を返してください。

1. ジャンル（書道/写真/陶芸/絵画/彫刻/その他のいずれか）
2. 初めて見る人向けの鑑賞ガイド

## 出力形式
ジャンル: （ジャンル名）
核心: （一文でこの作品の核心）
01: （ポイント1・50〜80字）
02: （ポイント2・50〜80字）
03: （ポイント3・50〜80字）`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
              { text: prompt }
            ]
          }]
        })
      })

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const lines = text.split('\n').filter(Boolean)

      const parsed = {
        genre: lines.find(l => l.startsWith('ジャンル:'))?.replace('ジャンル:', '').trim() || '不明',
        core: lines.find(l => l.startsWith('核心:'))?.replace('核心:', '').trim() || '',
        points: ['01', '02', '03'].map(n => ({
          num: n,
          text: lines.find(l => l.startsWith(`${n}:`))?.replace(`${n}:`, '').trim() || ''
        })).filter(p => p.text)
      }

      setGuide(parsed)
      setState('result')
    } catch (e) {
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
    startCamera()
  }

  return (
    <div style={{ background: '#0a0806', minHeight: '100vh', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── STATE: CAMERA ── */}
      {state === 'camera' && (
        <div style={s.cameraView}>
          <video ref={videoRef} autoPlay playsInline muted style={s.video} />

          {/* Scan frame overlay */}
          <div style={s.scanOverlay}>
            {['tl','tr','bl','br'].map(pos => (
              <div key={pos} style={{ ...s.corner, ...s.corners[pos] }} />
            ))}
            <div style={s.scanLine} />
          </div>

          {/* Top bar */}
          <div style={s.top}>
            <button style={s.circleBtn} onClick={() => navigate(-1)}>←</button>
            <span style={s.topTitle}>✦ 作品をスキャン</span>
            <div style={{ width: 36 }} />
          </div>

          {/* Instruction */}
          <div style={s.instruction}>
            <span style={s.instructionText}>作品を枠内に合わせてください</span>
          </div>

          {error && (
            <div style={s.errorBanner}>{error}</div>
          )}

          {/* Bottom */}
          <div style={s.bottom}>
            <div style={s.thumbPlaceholder} />
            <button style={s.shutter} onClick={handleShutter}>
              <div style={s.shutterInner} />
            </button>
            <div style={{ width: 48 }} />
          </div>
        </div>
      )}

      {/* ── STATE: ANALYZING ── */}
      {state === 'analyzing' && (
        <div style={s.analyzing}>
          <div style={s.analyzeArtwork}>
            <div style={s.pulseRing1} />
            <div style={s.pulseRing2} />
            <div style={s.pulseRing3} />
            {capturedImage && (
              <img src={capturedImage} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
            )}
          </div>
          <div style={s.analyzeLabel}>✦ Gemini が解析中</div>
          <div style={s.analyzeTitle}>作品を読み解いています</div>
          <div style={s.analyzeSub}>しばらくお待ちください</div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${((currentStep + 1) / STEPS.length) * 100}%`, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STEPS.map((step, i) => (
              <div key={step} style={s.step}>
                <span style={{
                  ...s.stepDot,
                  background: i <= currentStep ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                  animation: i === currentStep && i < STEPS.length - 1 ? 'dotPulse 1s ease-in-out infinite' : 'none'
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
                  color: i <= currentStep ? 'rgba(247,244,239,0.9)' : 'rgba(247,244,239,0.3)'
                }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATE: RESULT ── */}
      {state === 'result' && guide && (
        <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
          {/* Captured image */}
          <div style={s.resultHero}>
            {capturedImage && (
              <img src={capturedImage} alt="artwork" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <button style={s.resultBack} onClick={() => navigate(-1)}>←</button>
            <button style={s.retake} onClick={handleRetake}>撮り直す</button>
            <div style={s.detectedBadge}>
              <span style={s.detectedDot} />
              <span style={s.detectedText}>作品を検出</span>
              <span style={s.detectedGenre}>{guide.genre}</span>
            </div>
          </div>

          <div style={s.resultBody}>
            {/* Guide */}
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s.actionBtn} onClick={() => navigate('/')}>フィードへ</button>
              <button style={{ ...s.actionBtn, background: 'var(--ink)', color: 'var(--paper)' }}
                onClick={() => navigate('/exhibitions')}>展覧会を見る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  cameraView: { width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
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
  top: {
    position: 'absolute', top: 0, left: 0, right: 0,
    padding: '52px 20px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
    zIndex: 10,
  },
  circleBtn: { width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', fontSize: 16, color: 'white' },
  topTitle: { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  instruction: {
    position: 'absolute', top: 108, left: 0, right: 0, textAlign: 'center', zIndex: 10,
  },
  instructionText: {
    display: 'inline-block',
    background: 'rgba(193,127,74,0.15)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(193,127,74,0.3)', borderRadius: 20,
    padding: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: 10,
    color: 'var(--accent)', letterSpacing: '0.06em',
  },
  errorBanner: {
    position: 'absolute', bottom: 120, left: 20, right: 20,
    background: 'rgba(192,57,43,0.85)', color: 'white',
    borderRadius: 12, padding: '12px 16px', fontSize: 13,
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '24px 40px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    zIndex: 10,
  },
  thumbPlaceholder: { width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' },
  shutter: { width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: '50%', background: 'white' },

  analyzing: {
    minHeight: '100vh', background: 'var(--ink)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 40,
  },
  analyzeArtwork: {
    width: 160, height: 210,
    borderRadius: 6, marginBottom: 32,
    position: 'relative', overflow: 'hidden',
    background: 'var(--warm)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  },
  pulseRing1: { position: 'absolute', inset: -8, borderRadius: 10, border: '1.5px solid rgba(193,127,74,0.4)', animation: 'pulseRing 1.8s ease-out infinite' },
  pulseRing2: { position: 'absolute', inset: -16, borderRadius: 14, border: '1.5px solid rgba(193,127,74,0.25)', animation: 'pulseRing 1.8s ease-out infinite', animationDelay: '0.4s' },
  pulseRing3: { position: 'absolute', inset: -24, borderRadius: 18, border: '1.5px solid rgba(193,127,74,0.12)', animation: 'pulseRing 1.8s ease-out infinite', animationDelay: '0.8s' },
  analyzeLabel: { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 },
  analyzeTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--paper)', fontWeight: 300, marginBottom: 6 },
  analyzeSub: { fontSize: 12, color: 'rgba(247,244,239,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 28 },
  progressBar: { width: 200, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), #e8a870)', borderRadius: 2 },
  step: { display: 'flex', alignItems: 'center', gap: 8 },
  stepDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },

  resultHero: { width: '100%', height: 280, position: 'relative', overflow: 'hidden', background: 'var(--warm)' },
  resultBack: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, background: 'rgba(247,244,239,0.85)', border: 'none', borderRadius: '50%', fontSize: 16, backdropFilter: 'blur(8px)' },
  retake: { position: 'absolute', top: 16, right: 16, background: 'rgba(247,244,239,0.85)', border: 'none', borderRadius: 20, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', backdropFilter: 'blur(8px)', textTransform: 'uppercase' },
  detectedBadge: { position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(26,22,18,0.75)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  detectedDot: { width: 6, height: 6, borderRadius: '50%', background: '#4ade80' },
  detectedText: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
  detectedGenre: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)' },
  resultBody: { padding: '20px 20px 60px' },
  actionBtn: { flex: 1, padding: 12, borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', border: 'none', background: 'var(--warm)', color: 'var(--ink)' },
}
