'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewPropertyPage() {
  const [form, setForm] = useState({
    name: '',
    address: '',
    map_url: '',
    entry_method: '',
    cleaning_guide: '',
    completion_photo_url: '',
    checkin_time: '',
    checkout_time: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({
        name: form.name,
        address: form.address,
        map_url: form.map_url || null,
        entry_method: form.entry_method || null,
        cleaning_guide: form.cleaning_guide || null,
        completion_photo_url: form.completion_photo_url || null,
        checkin_time: form.checkin_time || null,
        checkout_time: form.checkout_time || null,
      })
      .select()
      .single()

    if (propError) {
      setError('物件の登録に失敗しました。')
      setLoading(false)
      return
    }

    await supabase.from('property_owners').insert({
      property_id: property.id,
      user_id: user.id,
    })

    router.push('/owner/properties')
    router.refresh()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/properties" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">物件登録</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            物件名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input-field"
            placeholder="渋谷マンション101"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            住所 <span className="text-red-500">*</span>
          </label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="input-field"
            placeholder="東京都渋谷区..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            地図URL
          </label>
          <input
            name="map_url"
            value={form.map_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            入室方法
          </label>
          <textarea
            name="entry_method"
            value={form.entry_method}
            onChange={handleChange}
            className="input-field"
            rows={3}
            placeholder="鍵の場所、暗証番号など"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            清掃ガイド・注意事項
          </label>
          <textarea
            name="cleaning_guide"
            value={form.cleaning_guide}
            onChange={handleChange}
            className="input-field"
            rows={4}
            placeholder="清掃時の注意事項を記載"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            完成図URL
          </label>
          <input
            name="completion_photo_url"
            value={form.completion_photo_url}
            onChange={handleChange}
            className="input-field"
            placeholder="理想的な清掃完了状態の写真URL"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェックイン時間
            </label>
            <input
              type="time"
              name="checkin_time"
              value={form.checkin_time}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェックアウト時間
            </label>
            <input
              type="time"
              name="checkout_time"
              value={form.checkout_time}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? '登録中...' : '登録する'}
          </button>
          <Link href="/owner/properties" className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
