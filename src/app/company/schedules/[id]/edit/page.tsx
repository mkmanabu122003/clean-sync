'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Loading from '@/components/ui/loading'
import { CleaningStatus } from '@/lib/types/database'

export default function EditSchedulePage() {
  const params = useParams()
  const id = params.id as string
  const [form, setForm] = useState({
    scheduled_date: '',
    checkin_time: '',
    notes: '',
    status: 'pending' as CleaningStatus,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data } = await supabase
        .from('cleaning_schedules')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setForm({
          scheduled_date: data.scheduled_date,
          checkin_time: data.checkin_time || '',
          notes: data.notes || '',
          status: data.status,
        })
      }
      setLoading(false)
    }
    fetchSchedule()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('cleaning_schedules')
      .update({
        scheduled_date: form.scheduled_date,
        checkin_time: form.checkin_time || null,
        notes: form.notes || null,
        status: form.status,
      })
      .eq('id', id)

    if (updateError) {
      setError('更新に失敗しました。')
      setSaving(false)
      return
    }

    router.push(`/company/schedules/${id}`)
    router.refresh()
  }

  if (loading) return <Loading />

  const statusOptions: { value: CleaningStatus; label: string }[] = [
    { value: 'pending', label: '承認待ち' },
    { value: 'approved', label: '承認済み' },
    { value: 'in_progress', label: '清掃中' },
    { value: 'completed', label: '完了' },
    { value: 'cancelled', label: 'キャンセル' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/company/schedules/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">予定編集</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
          <select
            value={form.status}
            onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as CleaningStatus }))}
            className="input-field"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">清掃予定日</label>
          <input
            type="date"
            value={form.scheduled_date}
            onChange={(e) => setForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">チェックイン時間</label>
          <input
            type="time"
            value={form.checkin_time}
            onChange={(e) => setForm(prev => ({ ...prev, checkin_time: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            className="input-field"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? '保存中...' : '保存する'}
          </button>
          <Link href={`/company/schedules/${id}`} className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
