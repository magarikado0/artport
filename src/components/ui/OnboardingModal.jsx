import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    icon: '📷',
    title: 'Artportへようこそ',
    description: '知らなかったアートに、気づいたら興味を持っていた。そんな体験を届けるアプリです。',
  },
  {
    icon: '🎯',
    title: 'カメラで作品を撮影して質問に答えるだけ',
    description: '3〜4問の選択式の質問に答えながら作品をじっくり見てみてください。',
  },
  {
    icon: '🖼️',
    title: '作品・展覧会を投稿してみんなに知らせよう',
    description: 'マイページから作品や展覧会を登録するとフィードに表示されます。',
  },
  {
    icon: '✨',
    title: 'アートが、変わって見える',
    description: 'AIがあなたの「見る」をサポートします。さあ、はじめましょう。',
  },
]

export default function OnboardingModal({ onClose }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(null)
  const navigate = useNavigate()

  const isLast = current === SLIDES.length - 1

  const next = () => {
    if (!isLast) setCurrent(i => i + 1)
  }

  const handleClose = (goCamera = false) => {
    onClose()
    if (goCamera) navigate('/camera')
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    // 左スワイプ50px以上で次へ
    if (diff > 50) next()
    touchStartX.current = null
  }

  const slide = SLIDES[current]

  return (
    <div className="fixed inset-0 bg-ink/60 z-[200] flex items-center justify-center px-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-paper rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        {/* アイコン */}
        <div className="text-5xl mb-6">{slide.icon}</div>

        {/* タイトル */}
        <h2 className="font-serif text-[22px] text-ink font-light leading-snug mb-3">
          {slide.title}
        </h2>

        {/* 説明文 */}
        <p className="text-sm text-muted font-sans leading-relaxed mb-8">
          {slide.description}
        </p>

        {/* ドットインジケーター */}
        <div className="flex justify-center items-center gap-1.5 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'bg-accent w-4' : 'bg-border w-2'
              }`}
            />
          ))}
        </div>

        {/* ボタン */}
        {isLast ? (
          <div className="flex flex-col gap-2">
            <button
              className="w-full py-3.5 bg-accent text-paper rounded-2xl font-mono text-[11px] tracking-wider active:scale-[0.98] transition-transform"
              onClick={() => handleClose(true)}
            >
              📷　カメラを使ってみる
            </button>
            <button
              className="w-full py-2 font-mono text-[10px] tracking-[0.15em] text-muted active:opacity-60"
              onClick={() => handleClose(false)}
            >
              スキップ
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              className="flex-1 py-3.5 border border-border text-muted rounded-2xl font-mono text-[11px] tracking-wider active:scale-[0.98] transition-transform"
              onClick={() => handleClose(false)}
            >
              スキップ
            </button>
            <button
              className="flex-1 py-3.5 bg-ink text-paper rounded-2xl font-mono text-[11px] tracking-wider active:scale-[0.98] transition-transform"
              onClick={next}
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
