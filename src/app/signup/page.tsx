'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { UserRole } from '@/lib/types/database'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('owner')
  const [companyName, setCompanyName] = useState('')
  const [step, setStep] = useState<'email' | 'otp' | 'profile'>('email')
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.error('OTP send error:', error.message, error.status)
      if (error.status === 429) {
        setError('送信回数の制限に達しました。しばらく待ってから再度お試しください。')
      } else {
        setError('送信に失敗しました。既に登録済みのメールアドレスの可能性があります。')
      }
    } else {
      setStep('otp')
      startCooldown()
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.error('Resend error:', error.message, error.status)
      setError('認証コードの再送信に失敗しました。')
    } else {
      startCooldown()
      setError('')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (verifyError) {
      console.error('OTP verify error:', verifyError.message, verifyError.status)
      setError('認証コードが正しくありません。')
    } else {
      setStep('profile')
      setError('')
    }
    setLoading(false)
  }

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      console.error('Password set error:', updateError.message)
      setError('パスワードの設定に失敗しました。')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error: userError } = await supabase.from('users').insert({
        id: user.id,
        email,
        name,
        role,
      })

      if (userError && !userError.message.includes('duplicate')) {
        setError('ユーザー情報の登録に失敗しました。')
        setLoading(false)
        return
      }

      if (role === 'company' && companyName) {
        const { data: companyData, error: companyError } = await supabase
          .from('cleaning_companies')
          .insert({ name: companyName })
          .select()
          .single()

        if (!companyError && companyData) {
          await supabase.from('cleaning_company_members').insert({
            cleaning_company_id: companyData.id,
            user_id: user.id,
            role: 'admin',
          })
        }
      }

      window.location.href = '/'
    }
    setLoading(false)
  }

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'owner', label: 'オーナー', description: '物件を所有し、清掃状況を管理' },
    { value: 'company', label: '清掃会社', description: '清掃業務の管理・スタッフ管理' },
    { value: 'staff', label: '清掃スタッフ', description: '清掃作業の実施・報告' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">CleanSync</h1>
          <p className="text-gray-500 mt-2">新規アカウント登録</p>
        </div>

        <div className="card">
          {/* ステップ表示 */}
          <div className="flex items-center justify-center mb-6 text-sm">
            <div className={`flex items-center ${step === 'email' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-1 ${step === 'email' ? 'bg-blue-600 text-white' : step === 'otp' || step === 'profile' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}>1</span>
              メール
            </div>
            <div className="w-8 h-px bg-gray-300 mx-2" />
            <div className={`flex items-center ${step === 'otp' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-1 ${step === 'otp' ? 'bg-blue-600 text-white' : step === 'profile' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}>2</span>
              認証
            </div>
            <div className="w-8 h-px bg-gray-300 mx-2" />
            <div className={`flex items-center ${step === 'profile' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-1 ${step === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</span>
              設定
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 'email' && (
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
          )}

          {step === 'otp' && (
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
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '')
                    if (v.length <= 8) setOtp(v)
                  }}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="00000000"
                  inputMode="numeric"
                  maxLength={8}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-primary w-full"
              >
                {loading ? '確認中...' : '認証する'}
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

          {step === 'profile' && (
            <form onSubmit={handleSetupProfile}>
              <p className="text-sm text-gray-600 mb-4">
                メールアドレスの確認が完了しました。アカウント情報を設定してください。
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="6文字以上"
                  minLength={6}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="山田 太郎"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ロール
                </label>
                <div className="space-y-2">
                  {roles.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        role === r.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={() => setRole(r.value)}
                        className="mt-0.5 mr-3"
                      />
                      <div>
                        <div className="font-medium text-sm">{r.label}</div>
                        <div className="text-xs text-gray-500">{r.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {role === 'company' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field"
                    placeholder="クリーンサポート株式会社"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? '登録中...' : '登録を完了'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-600 text-sm hover:underline">
              アカウントをお持ちの方はこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
