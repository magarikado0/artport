import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function OnboardingOverlay({ children, skip = false }) {
  const { user, loading } = useAuth()
  // sessionStorageで保持 → リロードしても再表示しない
  const [acknowledgedUid, setAcknowledgedUid] = useState(
    () => sessionStorage.getItem('artport_onboarded_uid')
  )
  const navigate = useNavigate()

  // loading完了後にユーザーがいない（＝ログアウト確定）ときのみクリア
  // ※loadingチェックがないとページロード直後のuser=nullでクリアされてしまう
  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.removeItem('artport_onboarded_uid')
      setAcknowledgedUid(null)
    }
  }, [user, loading])

  function finish(goCamera = false) {
    const uid = user?.uid ?? ''
    sessionStorage.setItem('artport_onboarded_uid', uid)
    setAcknowledgedUid(uid)
    if (goCamera) navigate('/camera')
  }

  // loading中 / 未ログイン / 確認済みUIDと一致 → 表示しない
  const showOnboarding = !loading && !skip && !!user && user.uid !== acknowledgedUid

  if (!showOnboarding) return children

  return (
    <div className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-between px-8 py-16">
      {/* 上部：ロゴ */}
      <p className="font-serif text-2xl text-paper tracking-wide">
        Art<span className="text-accent">port</span>
      </p>

      {/* 中央：メインコンテンツ */}
      <div className="flex flex-col items-center text-center gap-6">
        {/* カメラアイコン（パルスリング付き） */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-24 h-24 rounded-full bg-accent/20 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c17f4a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </div>

        {/* キャッチコピー */}
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] tracking-[0.25em] text-accent uppercase">
            ✦ AI Art Guide
          </p>
          <h1 className="font-serif text-[2rem] leading-tight text-paper font-light">
            アートに、<br />新しい出会いを
          </h1>
          <p className="font-sans text-[13px] text-paper/50 leading-relaxed max-w-[280px]">
            作品にカメラを向けるだけで、<br />
            AIがあなただけの鑑賞ガイドを<br />
            その場で生成します
          </p>
        </div>

        {/* ステップ説明 */}
        <div className="flex flex-col gap-2 w-full max-w-[260px]">
          {[
            { num: '01', text: '作品の前でカメラを起動' },
            { num: '02', text: 'シャッターを押すだけ' },
            { num: '03', text: 'AIガイドがすぐ表示される' },
          ].map(({ num, text }) => (
            <div key={num} className="flex items-center gap-3 py-2 border-b border-paper/10">
              <span className="font-mono text-[10px] text-accent">{num}</span>
              <span className="font-sans text-[12px] text-paper/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex flex-col items-center gap-3 w-full max-w-[320px]">
        <button
          onClick={() => finish(true)}
          className="w-full py-4 rounded-2xl bg-accent text-paper font-sans text-[14px] tracking-wide font-medium"
        >
          📷　カメラを使ってみる
        </button>
        <button
          onClick={() => finish(false)}
          className="font-mono text-[10px] tracking-[0.15em] text-paper/30 py-2"
        >
          スキップ
        </button>
      </div>
    </div>
  )
}
