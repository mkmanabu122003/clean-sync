'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const supabase = createClient()

  const startCooldown = useCallback(() => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const sendOtp = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('OTP send error:', error.message, error.status)
      if (error.status === 429) {
        setError('送信回数の制限に達しました。しばらく待ってから再度お試しください。')
      } else {
        setError('メールの送信に失敗しました。登録済みのメールアドレスをご確認ください。')
      }
      return false
    }
    return true
  }, [email, supabase.auth])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const success = await sendOtp()
    if (success) {
      setStep('otp')
      startCooldown()
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')

    const success = await sendOtp()
    if (success) {
      startCooldown()
      setError('')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      console.error('OTP verify error:', error.message, error.status)
      setError('認証コードが正しくありません。')
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">CleanSync</h1>
          <p className="text-gray-500 mt-2">民泊清掃管理</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-6">ログイン</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? '送信中...' : '認証コードを送信'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">{email}</span> に認証コードを送信しました。
              </p>
              <p className="text-xs text-gray-400 mb-4">
                メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  認証コード
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? '確認中...' : 'ログイン'}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCooldown > 0}
                className="btn-secondary w-full mt-2"
              >
                {resendCooldown > 0
                  ? `認証コードを再送信（${resendCooldown}秒）`
                  : '認証コードを再送信'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="text-sm text-gray-500 hover:text-gray-700 w-full mt-2"
              >
                メールアドレスを変更
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-blue-600 text-sm hover:underline">
              アカウントをお持ちでない方はこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
