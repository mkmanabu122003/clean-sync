import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CleaningStatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Wallet, Clock } from 'lucide-react'

export default async function StaffDashboard() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get staff record
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id, cleaning_company_id')
    .eq('user_id', user!.id)
    .single()

  if (!staffRecord) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">スタッフ登録がされていません。清掃会社の管理者にお問い合わせください。</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  // Today's assignments
  type StaffAssignmentItem = {
    id: string; payment_amount: number;
    cleaning_schedules: {
      id: string; scheduled_date: string; status: string; checkin_time: string | null;
      properties: { name: string; address: string } | null;
    } | null;
  }
  const { data: todaySchedules } = await supabase
    .from('staff_assignments')
    .select(`
      id, payment_amount,
      cleaning_schedules(id, scheduled_date, status, checkin_time,
        properties(name, address)
      )
    `)
    .eq('staff_id', staffRecord.id)
    .not('cleaning_schedules', 'is', null) as unknown as { data: StaffAssignmentItem[] | null }

  const todayItems = todaySchedules?.filter((sa) => {
    const cs = sa.cleaning_schedules
    return cs?.scheduled_date === today
  }) || []

  // This month earnings
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const monthStart = firstOfMonth.toISOString().split('T')[0]

  const allAssignments = todaySchedules || []
  const monthEarnings = allAssignments
    .filter((sa) => {
      const cs = sa.cleaning_schedules
      return cs && cs.scheduled_date >= monthStart && cs.status === 'completed'
    })
    .reduce((sum, sa) => sum + Number(sa.payment_amount), 0)

  const monthScheduled = allAssignments
    .filter((sa) => {
      const cs = sa.cleaning_schedules
      return cs && cs.scheduled_date >= monthStart && cs.status !== 'cancelled'
    })
    .reduce((sum, sa) => sum + Number(sa.payment_amount), 0)

  return (
    <div>
      <h1 className="page-title mb-6">ダッシュボード</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayItems.length}</p>
              <p className="text-xs text-gray-500">本日の予定</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Wallet size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(monthEarnings)}</p>
              <p className="text-xs text-gray-500">今月確定</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(monthScheduled)}</p>
              <p className="text-xs text-gray-500">今月予定</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's schedule */}
      <section>
        <h2 className="section-title mb-3">本日の清掃予定</h2>
        {todayItems.length > 0 ? (
          <div className="space-y-3">
            {todayItems.map((sa) => {
              const schedule = sa.cleaning_schedules
              const property = schedule?.properties
              return (
                <Link
                  key={sa.id}
                  href={`/staff/cleaning/${schedule?.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{property?.name}</p>
                      <p className="text-sm text-gray-500">{property?.address}</p>
                      {schedule?.checkin_time && (
                        <p className="text-xs text-gray-400">
                          チェックイン: {schedule.checkin_time}
                        </p>
                      )}
                    </div>
                    <CleaningStatusBadge status={schedule?.status as 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'} />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card text-center text-gray-400 py-8">
            本日の清掃予定はありません
          </div>
        )}
      </section>
    </div>
  )
}
