'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      setError('メールの送信に失敗しました。登録済みのメールアドレスをご確認ください。')
    } else {
      setStep('otp')
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
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="btn-secondary w-full mt-2"
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
