'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { CleaningStatusBadge } from '@/components/ui/status-badge'
import { CleaningStatus } from '@/lib/types/database'

interface ScheduleItem {
  id: string
  scheduled_date: string
  status: CleaningStatus
  properties: { name: string }
  staff_assignments: Array<{ staff: { name: string } }>
}

export default function CompanyCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('cleaning_company_members')
        .select('cleaning_company_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return
      const companyId = (member as { cleaning_company_id: string }).cleaning_company_id

      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const { data } = await supabase
        .from('cleaning_schedules')
        .select(`
          id, scheduled_date, status,
          properties(name),
          staff_assignments(staff(name))
        `)
        .eq('cleaning_company_id', companyId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })

      setSchedules((data as unknown as ScheduleItem[]) || [])
      setLoading(false)
    }
    fetchSchedules()
  }, [year, month, supabase])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return schedules.filter(s => s.scheduled_date === dateStr)
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">カレンダー</h1>
        <Link href="/company/schedules/new" className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} />
          予定登録
        </Link>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">
          {year}年{month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7">
          {weekdays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] border-t border-gray-100 bg-gray-50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const daySchedules = getSchedulesForDay(day)
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === day
            const dayOfWeek = (firstDayOfWeek + i) % 7

            return (
              <div
                key={day}
                className={`min-h-[60px] border-t border-gray-100 p-1 ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                <span
                  className={`text-xs ${
                    isToday
                      ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center'
                      : dayOfWeek === 0
                      ? 'text-red-500'
                      : dayOfWeek === 6
                      ? 'text-blue-500'
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <Link
                      key={schedule.id}
                      href={`/company/schedules/${schedule.id}`}
                      className={`block text-[10px] px-1 py-0.5 rounded truncate ${
                        schedule.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : schedule.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {schedule.properties?.name}
                    </Link>
                  ))}
                  {daySchedules.length > 3 && (
                    <span className="text-[10px] text-gray-400">
                      +{daySchedules.length - 3}件
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* List view for mobile */}
      {!loading && schedules.length > 0 && (
        <div className="mt-6 md:hidden">
          <h3 className="section-title mb-3">今月の予定一覧</h3>
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <Link
                key={schedule.id}
                href={`/company/schedules/${schedule.id}`}
                className="card block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{schedule.properties?.name}</p>
                    <p className="text-xs text-gray-500">{schedule.scheduled_date}</p>
                    {schedule.staff_assignments?.map((sa, i) => (
                      <p key={i} className="text-xs text-gray-400">{sa.staff?.name}</p>
                    ))}
                  </div>
                  <CleaningStatusBadge status={schedule.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
