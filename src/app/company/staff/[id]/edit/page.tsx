'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Loading from '@/components/ui/loading'

export default function EditStaffPage() {
  const params = useParams()
  const id = params.id as string
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setForm({
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
        })
      }
      setLoading(false)
    }
    fetchStaff()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('staff')
      .update({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
      })
      .eq('id', id)

    if (updateError) {
      setError('更新に失敗しました。')
      setSaving(false)
      return
    }

    router.push('/company/staff')
    router.refresh()
  }

  const handleDeactivate = async () => {
    if (!confirm('このスタッフを無効にしますか？')) return

    await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id)

    router.push('/company/staff')
    router.refresh()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/company/staff" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">スタッフ編集</h1>
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
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
          <input
            value={form.phone}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className="input-field"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? '保存中...' : '保存する'}
          </button>
          <Link href="/company/staff" className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>

      <div className="mt-6">
        <button onClick={handleDeactivate} className="btn-danger text-sm">
          このスタッフを無効にする
        </button>
      </div>
    </div>
  )
}
