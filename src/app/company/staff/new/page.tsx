'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewStaffPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: member } = await supabase
        .from('cleaning_company_members')
        .select('cleaning_company_id')
        .eq('user_id', user.id)
        .single()
      if (member) setCompanyId(member.cleaning_company_id)
    }
    fetchCompany()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('staff').insert({
      cleaning_company_id: companyId,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
    })

    if (insertError) {
      setError('登録に失敗しました。')
      setLoading(false)
      return
    }

    router.push('/company/staff')
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/company/staff" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">スタッフ登録</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            氏名 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="input-field"
            placeholder="山田 太郎"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
          <input
            value={form.phone}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
            className="input-field"
            placeholder="090-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className="input-field"
            placeholder="staff@example.com"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? '登録中...' : '登録する'}
          </button>
          <Link href="/company/staff" className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
