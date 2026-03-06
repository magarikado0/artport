import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeImageBase64, generateQuestionsBase64, generateSummaryFromAnswers } from '../lib/gemini'
import { saveViewingRecord } from '../lib/firestore'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/layout/BottomNav'
import { logEvent } from '../lib/analytics'

const GUIDE_STEPS = ['作品ジャンルを検出', '構図・技法を分析', '鑑賞ガイドを生成中...', '展覧会情報を照合']
const QUESTION_STEPS = ['作品ジャンルを検出', '構図・技法を分析', '気づきの質問を生成中...']
const SUMMARY_STEPS = ['回答を整理中', 'あなたの感性を分析中', 'まとめを生成中...']

export default function CameraPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // camera | mode-select | analyzing | result | analyzing-questions | questions | summary
  const [state, setState] = useState('camera')
  const [capturedImage, setCapturedImage] = useState(null)
  const [capturedBase64, setCapturedBase64] = useState(null)
  const [guide, setGuide] = useState(null)
  const [questionData, setQuestionData] = useState(null) // { genre, guide, questions }
  const [answers, setAnswers] = useState([null, null, null]) // [{choice, freeText}]
  const [revealedUpTo, setRevealedUpTo] = useState(0) // 0〜2：その番号の質問を現在アクティブ表示
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [freeText, setFreeText] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(GUIDE_STEPS)
  const [error, setError] = useState(null)
  const [summaryMessage, setSummaryMessage] = useState(null) // まとめメッセージ
  const [isSaving, setIsSaving] = useState(false)   // 保存中フラグ
  const [isSaved, setIsSaved] = useState(false)     // 保存済フラグ
  const questionRefs = useRef([null, null, null]) // 各質問へのscroll用ref

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
      logEvent('camera_open')
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
    const base64 = dataUrl.split(',')[1]
    setCapturedImage(dataUrl)
    setCapturedBase64(base64)
    stopCamera()
    logEvent('photo_taken')
    // 撮影後はモード選択画面へ
    setState('mode-select')
  }

  // ── ガイドモード ───────────────────────────────────
  async function handleSelectGuide() {
    setSteps(GUIDE_STEPS)
    setCurrentStep(0)
    setState('analyzing')
    logEvent('guide_mode_selected')

    // ステップアニメーション
    for (let i = 0; i < GUIDE_STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 800))
      setCurrentStep(i + 1)
    }

    try {
      const text = await analyzeImageBase64(capturedBase64)
      if (!text) throw new Error('no response')
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
      logEvent('guide_generated', { genre: parsed.genre, source: 'camera' })
      setState('result')
    } catch (e) {
      setError('解析に失敗しました。もう一度お試しください。')
      setState('mode-select')
    }
  }

  // ── 質問モード ─────────────────────────────────────
  async function handleSelectQuestions() {
    setSteps(QUESTION_STEPS)
    setCurrentStep(0)
    setState('analyzing-questions')
    logEvent('questions_mode_selected')

    // ステップアニメーション
    for (let i = 0; i < QUESTION_STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 800))
      setCurrentStep(i + 1)
    }

    try {
      const data = await generateQuestionsBase64(capturedBase64)
      if (!data) throw new Error('no response')
      setQuestionData(data)
      setAnswers([null, null, null])
      setRevealedUpTo(0)
      setSelectedChoice(null)
      setFreeText('')
      setShowExplanation(false)
      logEvent('questions_generated', { genre: data.genre })
      setState('questions')
    } catch (e) {
      setError('質問の生成に失敗しました。もう一度お試しください。')
      setState('mode-select')
    }
  }

  // ── 質問回答・次の質問へ ─────────────────────────────
  function handleConfirmAnswer() {
    // 現在の回答を保存
    const next = [...answers]
    next[revealedUpTo] = { choice: selectedChoice, freeText }
    setAnswers(next)
    setShowExplanation(true)
  }

  async function handleAdvance() {
    if (revealedUpTo < 2) {
      const nextIdx = revealedUpTo + 1
      setRevealedUpTo(nextIdx)
      setSelectedChoice(null)
      setFreeText('')
      setShowExplanation(false)
      // 少し遅延してから新しい質問へスクロール
      setTimeout(() => {
        questionRefs.current[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    } else {
      // 最後の質問：まとめを生成してからsummaryへ
      const qas = questionData.questions.map((q, i) => ({
        question: q.text,
        answer: answers[i]?.choice
          ? (answers[i].freeText ? `${answers[i].choice}（${answers[i].freeText}）` : answers[i].choice)
          : (answers[i]?.freeText || '回答なし')
      }))
      setSteps(SUMMARY_STEPS)
      setCurrentStep(0)
      setState('analyzing-summary')
      // ステップアニメーション
      for (let i = 0; i < SUMMARY_STEPS.length - 1; i++) {
        await new Promise(r => setTimeout(r, 800))
        setCurrentStep(i + 1)
      }
      try {
        const msg = await generateSummaryFromAnswers(capturedBase64, qas, questionData.genre)
        setSummaryMessage(msg || null)
        logEvent('summary_generated', { genre: questionData.genre })
      } catch (e) {
        console.error('[CameraPage] まとめ生成エラー:', e)
        setSummaryMessage(null)
      }
      setState('summary')
    }
  }

  // ガイドモードの記録を保存
  async function handleSaveGuideRecord() {
    if (!user || isSaving || isSaved) return
    setIsSaving(true)
    try {
      await saveViewingRecord(user.uid, 'guide', {
        genre: guide.genre,
        guide: { core: guide.core, points: guide.points },
      }, capturedBase64)
      setIsSaved(true)
      logEvent('viewing_record_saved', { type: 'guide', genre: guide.genre || 'unknown' })
    } catch (e) {
      console.error('[CameraPage] ガイド記録保存エラー:', e)
    } finally {
      setIsSaving(false)
    }
  }

  // 質問サマリーの記録を保存
  async function handleSaveSummaryRecord() {
    if (!user || isSaving || isSaved) return
    setIsSaving(true)
    try {
      await saveViewingRecord(user.uid, 'questions', {
        genre: questionData.genre,
        summary: summaryMessage,
        questions: questionData.questions,
        answers,
      }, capturedBase64)
      setIsSaved(true)
      logEvent('viewing_record_saved', { type: 'questions', genre: questionData.genre })
    } catch (e) {
      console.error('[CameraPage] サマリー記録保存エラー:', e)
    } finally {
      setIsSaving(false)
    }
  }

  function handleRetake() {
    setState('camera')
    setCapturedImage(null)
    setCapturedBase64(null)
    setGuide(null)
    setQuestionData(null)
    setAnswers([null, null, null])
    setRevealedUpTo(0)
    setSelectedChoice(null)
    setFreeText('')
    setShowExplanation(false)
    setCurrentStep(0)
    setError(null)
    setSummaryMessage(null)
    setIsSaving(false)
    setIsSaved(false)
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

      {/* ── STATE: MODE-SELECT ── */}
      {state === 'mode-select' && capturedImage && (
        <div className="min-h-screen bg-ink flex flex-col">
          {/* 撮影画像 */}
          <div className="w-full h-[300px] relative overflow-hidden bg-warm">
            <img src={capturedImage} alt="captured" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink" />
            <button className="absolute top-[52px] left-4 w-9 h-9 bg-black/40 border border-white/20 rounded-full text-white backdrop-blur-sm"
              onClick={handleRetake}>←</button>
            <div className="absolute top-[52px] left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5">
              <span className="font-mono text-[10px] tracking-[0.1em] text-white/80 uppercase">❖ 作品を検出</span>
            </div>
          </div>

          {/* モード選択 */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 -mt-4">
            <div className="font-serif text-[24px] text-paper font-light mb-2">どのように鑑賞しますか？</div>
            <div className="font-mono text-[11px] text-paper/40 tracking-wider mb-8">モードを選んでください</div>

            {error && (
              <div className="w-full bg-red-600/85 text-white rounded-xl px-4 py-3 text-[13px] text-center mb-5">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-4">
              {/* インタラクティブ質問 */}
              <button
                className="w-full rounded-2xl bg-accent/10 border border-accent/30 p-5 text-left active:scale-[0.98] transition-transform"
                onClick={handleSelectQuestions}
              >
                <div className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase mb-2">❖ インタラクティブ</div>
                <div className="font-serif text-[18px] text-paper font-light mb-1">質問に答える【推奨】</div>
                <div className="font-mono text-[11px] text-paper/50">3つの質問に答えてまとめと鑑賞ガイドをもらう</div>
              </button>

              {/* AIガイド */}
              <button
                className="w-full rounded-2xl bg-accent/5 border border-accent/30 p-5 text-left active:scale-[0.98] transition-transform"
                onClick={handleSelectGuide}
              >
                <div className="font-mono text-[10px] tracking-[0.12em] text-paper/50 uppercase mb-2">□ AI 鑑賞ガイド</div>
                <div className="font-serif text-[18px] text-paper font-light mb-1">ガイドを読む</div>
                <div className="font-mono text-[11px] text-paper/50">AIが作品のポイント3つを解説します</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE: ANALYZING / ANALYZING-QUESTIONS / ANALYZING-SUMMARY ── */}
      {(state === 'analyzing' || state === 'analyzing-questions' || state === 'analyzing-summary') && (
        <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-10">
          <div className="w-40 h-[210px] rounded-md mb-8 relative overflow-hidden bg-warm shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div style={s.pulseRing1} />
            <div style={s.pulseRing2} />
            <div style={s.pulseRing3} />
            {capturedImage && (
              <img src={capturedImage} alt="captured" className="w-full h-full object-contain rounded-md" />
            )}
          </div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-accent uppercase mb-3">✦ 解析中</div>
          <div className="font-serif text-[22px] text-paper font-light mb-1.5">作品を読み解いています</div>
          <div className="text-[12px] text-paper/40 font-mono mb-7">しばらくお待ちください</div>
          <div className="w-[200px] h-0.5 bg-white/10 rounded-sm overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-accent to-[#e8a870] rounded-sm transition-all duration-[600ms] ease-out" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i <= currentStep ? 'bg-accent' : 'bg-white/20'}`}
                  style={{ animation: i === currentStep ? 'dotPulse 1s ease-in-out infinite' : 'none' }} />
                <span className={`font-mono text-[10px] tracking-wider ${i <= currentStep ? 'text-paper/90' : 'text-paper/30'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          {/* 最後のステップ到達後もAPIが処理中であることを示すスピナー */}
          {currentStep >= steps.length - 1 && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-white/15 border-t-accent animate-spin" />
              <span className="font-mono text-[9px] tracking-wider text-paper/30">解析中...</span>
            </div>
          )}
        </div>
      )}

      {/* ── STATE: RESULT ── */}
      {state === 'result' && guide && (
        <div className="bg-paper min-h-screen">
          {/* Captured image */}
          <div className="w-full h-[280px] relative overflow-hidden bg-warm">
            {capturedImage && (
              <img src={capturedImage} alt="artwork" className="w-full h-full object-contain" />
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

          <div className="p-5 pb-[100px]">
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
            </div>

            {/* Actions */}
            {/* 記録ボタン */}
            {user && (
              <button
                className={`w-full py-3.5 rounded-2xl font-mono text-[11px] tracking-wider mt-5 border transition-all ${
                  isSaved
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-warm border-border text-ink active:scale-[0.98]'
                }`}
                onClick={handleSaveGuideRecord}
                disabled={isSaving || isSaved}
              >
                {isSaving ? '保存中...' : isSaved ? '✔ 記録しました' : '☆ 鑑賞を記録する'}
              </button>
            )}
            <div className="flex gap-2.5 mt-3">
              <button className="flex-1 py-3 rounded-xl font-mono text-[10px] tracking-wider bg-warm text-ink" onClick={() => navigate('/')}>
                フィードへ
              </button>
              <button className="flex-1 py-3 rounded-xl font-mono text-[10px] tracking-wider bg-ink text-paper" onClick={() => navigate('/exhibitions')}>
                展覧会を見る
              </button>
            </div>
          </div>
          <BottomNav />
        </div>
      )}

      {/* ── STATE: QUESTIONS ── */}
      {state === 'questions' && questionData && (
        <div className="bg-paper min-h-screen flex flex-col">
          {/* 撮影画像 + ヘッダー（固定） */}
          <div className="w-full h-[220px] relative overflow-hidden bg-warm flex-shrink-0">
            {capturedImage && (
              <img src={capturedImage} alt="artwork" className="w-full h-full object-contain" />
            )}
            <button className="absolute top-4 left-4 w-9 h-9 bg-paper/85 rounded-full backdrop-blur-sm"
              onClick={() => setState('mode-select')}>←</button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ink/75 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="font-mono text-[9px] text-white/80">{questionData.genre}</span>
            </div>
          </div>


          {/* スクロールエリア */}
          <div className="flex-1 overflow-y-auto p-5 pb-[80px]">
            {/* 鑑賞ガイド */}
            {questionData.guide && (
              <div className="guide-card mb-4">
                <div className="guide-label">✦ 鑑賞ガイド</div>
                <div className="guide-text text-[13px] leading-relaxed">{questionData.guide}</div>
              </div>
            )}

            {/* 正解なしのノート */}
            {questionData.note && (
              <div className="flex items-center gap-2.5 bg-accent/8 border border-accent/25 rounded-xl px-4 py-3 mb-5">
                <span className="text-accent text-[14px] flex-shrink-0">✦</span>
                <span className="font-sans text-[12px] text-ink/70 leading-snug">{questionData.note}</span>
              </div>
            )}

            {/* 質問リスト（revealedUpTo以下のみ表示） */}
            {questionData.questions.map((q, i) => {
              if (i > revealedUpTo) return null // まだ表示しない

              const isActive = i === revealedUpTo
              const isAnswered = i < revealedUpTo
              const ans = answers[i]

              return (
                <div
                  key={q.num}
                  ref={el => { questionRefs.current[i] = el }}
                  className="mb-4"
                >
                  {/* ── 圧縮ビュー（回答済み） ── */}
                  {isAnswered && (
                    <div className="rounded-2xl border border-border overflow-hidden">
                      <div className="flex items-center gap-3 bg-warm px-4 py-3">
                        <span className="font-mono text-[10px] text-accent font-bold flex-shrink-0">{q.num}</span>
                        <span className="font-sans text-[13px] text-ink flex-1 leading-snug">{q.text}</span>
                        <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[8px] text-accent">✓</span>
                        </span>
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
                  )}

                  {/* ── アクティブ質問（現在回答中） ── */}
                  {isActive && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-mono text-[11px] text-accent font-bold">{q.num}</span>
                        <span className="font-sans text-[16px] text-ink font-medium leading-snug">{q.text}</span>
                      </div>

                      {/* 選択肢 */}
                      <div className="flex flex-col gap-2.5 mb-4">
                        {q.choices.map((choice, ci) => (
                          <button
                            key={ci}
                            disabled={showExplanation}
                            onClick={() => !showExplanation && setSelectedChoice(choice)}
                            className={`w-full text-left px-4 py-3 rounded-xl border font-sans text-[14px] transition-all ${
                              selectedChoice === choice
                                ? 'bg-accent/10 border-accent text-ink'
                                : 'bg-warm border-border text-ink active:bg-warm/70'
                            } ${showExplanation && selectedChoice !== choice ? 'opacity-40' : ''}`}
                          >
                            <span className="font-mono text-[10px] text-muted mr-2">{String.fromCharCode(65 + ci)}</span>
                            {choice}
                          </button>
                        ))}
                      </div>

                      {/* 自由記述 */}
                      <textarea
                        className="w-full bg-warm border border-border rounded-xl px-4 py-3 font-sans text-[13px] text-ink placeholder:text-muted/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 mb-4"
                        rows={2}
                        placeholder="上の選択肢以外の答えがあれば自由に（これだけでも回答可）"
                        disabled={showExplanation}
                        value={freeText}
                        onChange={e => setFreeText(e.target.value)}
                      />

                      {/* 解説カード */}
                      {showExplanation && (
                        <div className="bg-ink rounded-xl px-5 py-4 mb-4 border border-accent/20">
                          <div className="font-mono text-[9px] tracking-[0.12em] text-accent uppercase mb-2">✦ 解説</div>
                          <div className="font-sans text-[14px] text-paper leading-relaxed">{q.explanation}</div>
                        </div>
                      )}

                      {/* ボタン */}
                      {!showExplanation ? (
                        <button
                          className="btn-primary w-full"
                          disabled={!selectedChoice && !freeText.trim()}
                          onClick={handleConfirmAnswer}
                        >
                          回答する
                        </button>
                      ) : (
                        <button
                          className="btn-primary w-full"
                          onClick={handleAdvance}
                        >
                          {i === 2 ? '結果を見る' : '次の質問へ ↓'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STATE: SUMMARY ── */}
      {state === 'summary' && questionData && (
        <div className="bg-paper min-h-screen">
          {/* 撮影画像 */}
          <div className="w-full h-[280px] relative overflow-hidden bg-warm">
            {capturedImage && (
              <img src={capturedImage} alt="artwork" className="w-full h-full object-contain" />
            )}
            <button className="absolute top-4 left-4 w-9 h-9 bg-paper/85 rounded-full backdrop-blur-sm" onClick={() => navigate(-1)}>←</button>
            <button className="absolute top-4 right-4 bg-paper/85 backdrop-blur-sm rounded-full px-3.5 py-2 font-mono text-[9px] tracking-wider uppercase" onClick={handleRetake}>
              撮り直す
            </button>
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-ink/75 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="font-mono text-[9px] text-white/80">{questionData.genre}</span>
              <span className="font-mono text-[9px] text-paper/40">全問回答済</span>
            </div>
          </div>

          <div className="p-5 pb-[100px]">
            <div className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase mb-1">❖ 鑑賞記録</div>
            <div className="font-serif text-[22px] text-ink font-light mb-5">鑑賞の足跡</div>

            {/* まとめメッセージ */}
            {summaryMessage?.message && (
              <div className="guide-card mb-5">
                <div className="guide-label">✦ あなたの鑑賞まとめ</div>
                {summaryMessage.keyword && (
                  <div className="font-serif text-[22px] text-paper font-light leading-snug mb-3">{summaryMessage.keyword}</div>
                )}
                <div className="flex flex-col gap-2.5 mt-1">
                  {summaryMessage.message.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="font-sans text-[15px] leading-relaxed text-paper/90 font-light">{line}</div>
                  ))}
                </div>
              </div>
            )}

            {/* AI鑑賞ガイド */}
            {summaryMessage?.guide && (
              <div className="guide-card mb-6">
                <div className="guide-label">❖ AI 鑑賞ガイド</div>
                {summaryMessage.guide.core && (
                  <div className="guide-text">{summaryMessage.guide.core}</div>
                )}
                {summaryMessage.guide.points?.length > 0 && (
                  <div className="guide-points">
                    {summaryMessage.guide.points.map(p => (
                      <div className="guide-point" key={p.num}>
                        <span className="guide-point-num">{p.num}</span>
                        <span>{p.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* 記録ボタン */}
            {user && (
              <button
                className={`w-full py-3.5 rounded-2xl font-mono text-[11px] tracking-wider mb-3 border transition-all ${
                  isSaved
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-warm border-border text-ink active:scale-[0.98]'
                }`}
                onClick={handleSaveSummaryRecord}
                disabled={isSaving || isSaved}
              >
                {isSaving ? '保存中...' : isSaved ? '✔ 記録しました' : '☆ 鑑賞を記録する'}
              </button>
            )}
          </div>
          <BottomNav />
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
