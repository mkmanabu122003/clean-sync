'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Key, BookOpen, Camera, Clock, Play, CheckCircle } from 'lucide-react'
import Loading from '@/components/ui/loading'
import { CleaningStatusBadge } from '@/components/ui/status-badge'
import { CleaningStatus } from '@/lib/types/database'

interface Property {
  name: string
  address: string
  map_url: string | null
  entry_method: string | null
  cleaning_guide: string | null
  completion_photo_url: string | null
  checkin_time: string | null
  checkout_time: string | null
}

interface ChecklistItem {
  id: string
  item_name: string
  display_order: number
}

export default function StaffCleaningPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<Record<string, unknown> | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [checklists, setChecklists] = useState<ChecklistItem[]>([])
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [staffId, setStaffId] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id, cleaning_company_id')
        .eq('user_id', user.id)
        .single()

      if (!staffRecord) return
      setStaffId(staffRecord.id)

      const { data: scheduleData } = await supabase
        .from('cleaning_schedules')
        .select(`
          id, scheduled_date, status, checkin_time, notes,
          property_id, cleaning_company_id,
          properties(name, address, map_url, entry_method, cleaning_guide, completion_photo_url, checkin_time, checkout_time)
        `)
        .eq('id', id)
        .single() as unknown as { data: {
          id: string; scheduled_date: string; status: string; checkin_time: string | null;
          notes: string | null; property_id: string; cleaning_company_id: string;
          properties: Property | null;
        } | null }

      if (scheduleData) {
        setSchedule(scheduleData)
        setProperty(scheduleData.properties as Property)

        // Fetch checklists
        const { data: checklistData } = await supabase
          .from('checklists')
          .select('id, item_name, display_order')
          .eq('cleaning_company_id', scheduleData.cleaning_company_id)
          .or(`property_id.is.null,property_id.eq.${scheduleData.property_id}`)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        setChecklists(checklistData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [id, supabase])

  const handleStartCleaning = async () => {
    setSaving(true)
    await supabase
      .from('cleaning_schedules')
      .update({ status: 'in_progress' as CleaningStatus })
      .eq('id', id)

    // Create report with start time
    await supabase.from('cleaning_reports').insert({
      cleaning_schedule_id: id as string,
      staff_id: staffId,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    })

    setSchedule(prev => prev ? { ...prev, status: 'in_progress' } : null)
    setSaving(false)
  }

  const handleCompleteCleaning = async () => {
    setSaving(true)

    // Update schedule status
    await supabase
      .from('cleaning_schedules')
      .update({ status: 'completed' as CleaningStatus })
      .eq('id', id)

    // Update or create report
    const { data: existingReport } = await supabase
      .from('cleaning_reports')
      .select('id')
      .eq('cleaning_schedule_id', id as string)
      .eq('staff_id', staffId)
      .single()

    if (existingReport) {
      await supabase
        .from('cleaning_reports')
        .update({
          completed_at: new Date().toISOString(),
          notes: notes || null,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existingReport.id)

      // Save checklist responses
      if (checklists.length > 0) {
        const responses = checklists.map(cl => ({
          cleaning_report_id: existingReport.id,
          checklist_id: cl.id,
          is_checked: checkedItems[cl.id] || false,
        }))
        await supabase.from('checklist_responses').upsert(responses, {
          onConflict: 'cleaning_report_id,checklist_id',
        })
      }
    } else {
      const { data: newReport } = await supabase
        .from('cleaning_reports')
        .insert({
          cleaning_schedule_id: id as string,
          staff_id: staffId,
          completed_at: new Date().toISOString(),
          notes: notes || null,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newReport && checklists.length > 0) {
        const responses = checklists.map(cl => ({
          cleaning_report_id: newReport.id,
          checklist_id: cl.id,
          is_checked: checkedItems[cl.id] || false,
        }))
        await supabase.from('checklist_responses').insert(responses)
      }
    }

    router.push('/staff')
    router.refresh()
  }

  if (loading) return <Loading />
  if (!schedule || !property) return <div className="text-center py-12 text-gray-500">予定が見つかりません</div>

  const status = schedule.status as CleaningStatus

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/staff" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">清掃詳細</h1>
      </div>

      {/* Schedule info */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">{property.name}</h2>
          <CleaningStatusBadge status={status} />
        </div>
        <p className="text-sm text-gray-500">{schedule.scheduled_date as string}</p>
      </div>

      {/* Property info */}
      <div className="card mb-4">
        <h3 className="font-medium mb-3">物件情報</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">{property.address}</p>
              {property.map_url && (
                <a href={property.map_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">
                  地図を開く
                </a>
              )}
            </div>
          </div>

          {property.entry_method && (
            <div className="flex items-start gap-2">
              <Key size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">入室方法</p>
                <p className="text-sm whitespace-pre-wrap">{property.entry_method}</p>
              </div>
            </div>
          )}

          {property.cleaning_guide && (
            <div className="flex items-start gap-2">
              <BookOpen size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">清掃ガイド</p>
                <p className="text-sm whitespace-pre-wrap">{property.cleaning_guide}</p>
              </div>
            </div>
          )}

          {property.checkin_time && (
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm">IN {property.checkin_time} / OUT {property.checkout_time}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {status === 'approved' || status === 'pending' ? (
        <button
          onClick={handleStartCleaning}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 mb-4"
        >
          <Play size={18} />
          {saving ? '処理中...' : '清掃を開始する'}
        </button>
      ) : status === 'in_progress' ? (
        <div className="space-y-4 mb-4">
          {/* Checklist */}
          {checklists.length > 0 && (
            <div className="card">
              <h3 className="font-medium mb-3">チェックリスト</h3>
              <div className="space-y-2">
                {checklists.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems[item.id] || false}
                      onChange={(e) => setCheckedItems(prev => ({
                        ...prev,
                        [item.id]: e.target.checked,
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{item.item_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <h3 className="font-medium mb-2">報告メモ</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="清掃の報告内容を記載..."
            />
          </div>

          <button
            onClick={handleCompleteCleaning}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <CheckCircle size={18} />
            {saving ? '処理中...' : '清掃完了を報告'}
          </button>
        </div>
      ) : null}

      {/* Completion photo reference */}
      {property.completion_photo_url && (
        <div className="card">
          <h3 className="font-medium mb-2">
            <Camera size={16} className="inline mr-1" />
            完成図（参考）
          </h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.completion_photo_url}
            alt="完成図"
            className="w-full rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
