import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function EmailLoginPage() {
  const { loginWithEmail, signupWithEmail } = useAuth()
  const navigate = useNavigate()
  
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        if (!name.trim()) {
          setError('名前を入力してください')
          setLoading(false)
          return
        }
        await signupWithEmail(email, password, name)
      } else {
        await loginWithEmail(email, password)
      }
      navigate('/')
    } catch (e) {
      console.error(e)
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (e.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています')
      } else if (e.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で設定してください')
      } else if (e.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません')
      } else if (e.code === 'auth/missing-password') {
        setError('パスワードを入力してください')
      } else if (e.code === 'auth/invalid-login-credentials') {
        setError('ログイン情報が正しくありません')
      } else {
        setError(`エラーが発生しました: ${e.code || e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center">
        <button 
          onClick={() => navigate('/login')}
          className="text-ink text-xl"
        >
          ←
        </button>
        <h1 className="font-serif text-xl text-ink flex-1 text-center mr-8">
          {isSignup ? '新規登録' : 'ログイン'}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          {isSignup && (
            <div className="mb-4">
              <label className="form-label">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="山田 太郎"
                required
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="example@artport.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="6文字以上"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-sans text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mb-4 disabled:opacity-50"
          >
            {loading ? '処理中...' : (isSignup ? '登録する' : 'ログイン')}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup)
              setError('')
            }}
            className="w-full text-center font-sans text-[13px] text-muted"
          >
            {isSignup ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
          </button>
        </form>

        <div className="max-w-md mx-auto mt-8 p-4 bg-warm/30 rounded-xl border border-border">
          <p className="font-mono text-[10px] text-muted text-center leading-relaxed">
            ✦ デモアカウント<br/>
            email: demo@artport.com<br/>
            password: demo123
          </p>
        </div>
      </div>
    </div>
  )
}
