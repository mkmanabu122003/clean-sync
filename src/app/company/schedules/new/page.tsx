'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Property {
  id: string
  name: string
  property_id: string
}

interface StaffMember {
  id: string
  name: string
}

export default function NewSchedulePage() {
  const [form, setForm] = useState({
    property_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    checkin_time: '',
    notes: '',
    staff_ids: [] as string[],
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('cleaning_company_members')
        .select('cleaning_company_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return
      setCompanyId(member.cleaning_company_id)

      const { data: props } = await supabase
        .from('property_cleaning_companies')
        .select('property_id, properties(id, name)')
        .eq('cleaning_company_id', member.cleaning_company_id)
        .eq('is_active', true)

      setProperties(
        (props || []).map((p: Record<string, unknown>) => ({
          id: (p.properties as Record<string, unknown>)?.id as string,
          name: (p.properties as Record<string, unknown>)?.name as string,
          property_id: p.property_id as string,
        }))
      )

      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name')
        .eq('cleaning_company_id', member.cleaning_company_id)
        .eq('is_active', true)

      setStaffList(staffData || [])
    }
    fetchData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!companyId || !form.property_id) {
      setError('物件を選択してください。')
      setLoading(false)
      return
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from('cleaning_schedules')
      .insert({
        property_id: form.property_id,
        cleaning_company_id: companyId,
        scheduled_date: form.scheduled_date,
        checkin_time: form.checkin_time || null,
        notes: form.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (scheduleError) {
      setError('登録に失敗しました。')
      setLoading(false)
      return
    }

    // Assign staff
    if (form.staff_ids.length > 0) {
      // Get payment rate
      const { data: pcc } = await supabase
        .from('property_cleaning_companies')
        .select('payment_rate')
        .eq('property_id', form.property_id)
        .eq('cleaning_company_id', companyId)
        .single()

      const paymentRate = pcc?.payment_rate || 0

      const assignments = form.staff_ids.map(staffId => ({
        cleaning_schedule_id: schedule.id,
        staff_id: staffId,
        payment_amount: paymentRate,
      }))

      await supabase.from('staff_assignments').insert(assignments)
    }

    router.push('/company/calendar')
    router.refresh()
  }

  const toggleStaff = (staffId: string) => {
    setForm(prev => ({
      ...prev,
      staff_ids: prev.staff_ids.includes(staffId)
        ? prev.staff_ids.filter(id => id !== staffId)
        : [...prev.staff_ids, staffId],
    }))
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/company/calendar" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">清掃予定登録</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            物件 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.property_id}
            onChange={(e) => setForm(prev => ({ ...prev, property_id: e.target.value }))}
            className="input-field"
            required
          >
            <option value="">選択してください</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            清掃予定日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.scheduled_date}
            onChange={(e) => setForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            チェックイン時間
          </label>
          <input
            type="time"
            value={form.checkin_time}
            onChange={(e) => setForm(prev => ({ ...prev, checkin_time: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            className="input-field"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            担当スタッフ
          </label>
          {staffList.length > 0 ? (
            <div className="space-y-2">
              {staffList.map(staff => (
                <label
                  key={staff.id}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    form.staff_ids.includes(staff.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.staff_ids.includes(staff.id)}
                    onChange={() => toggleStaff(staff.id)}
                    className="mr-3"
                  />
                  <span className="text-sm">{staff.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">スタッフが登録されていません</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? '登録中...' : '登録する'}
          </button>
          <Link href="/company/calendar" className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
