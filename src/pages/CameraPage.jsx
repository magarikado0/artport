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
    <div className="min-h-screen bg-ink relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── STATE: CAMERA ── */}
      {state === 'camera' && (
        <div className="w-full h-screen relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Scan frame overlay */}
          <div style={s.scanOverlay}>
            {['tl','tr','bl','br'].map(pos => (
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
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-ink/75 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="font-mono text-[9px] text-white/80">作品を検出</span>
              <span className="font-mono text-[9px] text-accent">{guide.genre}</span>
            </div>
          </div>

          <div className="p-5 pb-[60px]">
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
