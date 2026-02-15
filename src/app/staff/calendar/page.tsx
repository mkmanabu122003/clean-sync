'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CleaningStatus } from '@/lib/types/database'

interface ScheduleItem {
  id: string
  cleaning_schedules: {
    id: string
    scheduled_date: string
    status: CleaningStatus
    properties: { name: string }
  }
}

export default function StaffCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<ScheduleItem[]>([])
  const [, setLoading] = useState(true)
  const supabase = createClient()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!staffRecord) return

      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const { data } = await supabase
        .from('staff_assignments')
        .select(`
          id,
          cleaning_schedules!inner(id, scheduled_date, status,
            properties(name)
          )
        `)
        .eq('staff_id', staffRecord.id)
        .gte('cleaning_schedules.scheduled_date', startDate)
        .lte('cleaning_schedules.scheduled_date', endDate)

      setAssignments((data as unknown as ScheduleItem[]) || [])
      setLoading(false)
    }
    fetchData()
  }, [year, month, supabase])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']

  const getAssignmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return assignments.filter(a => a.cleaning_schedules?.scheduled_date === dateStr)
  }

  return (
    <div>
      <h1 className="page-title mb-6">カレンダー</h1>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">{year}年{month + 1}月</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

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

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] border-t border-gray-100 bg-gray-50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayAssignments = getAssignmentsForDay(day)
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day
            const dayOfWeek = (firstDayOfWeek + i) % 7

            return (
              <div key={day} className={`min-h-[60px] border-t border-gray-100 p-1 ${isToday ? 'bg-blue-50' : ''}`}>
                <span className={`text-xs ${
                  isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center' :
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayAssignments.map((a) => (
                    <Link
                      key={a.id}
                      href={`/staff/cleaning/${a.cleaning_schedules.id}`}
                      className={`block text-[10px] px-1 py-0.5 rounded truncate ${
                        a.cleaning_schedules.status === 'completed' ? 'bg-green-100 text-green-700' :
                        a.cleaning_schedules.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {a.cleaning_schedules.properties?.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
