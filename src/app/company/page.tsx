import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CleaningStatusBadge } from '@/components/ui/status-badge'
import { Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react'

async function getCompanyId(supabase: ReturnType<typeof createServerSupabaseClient>, userId: string) {
  const { data } = await supabase
    .from('cleaning_company_members')
    .select('cleaning_company_id')
    .eq('user_id', userId)
    .single()
  return data?.cleaning_company_id
}

export default async function CompanyDashboard() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const companyId = await getCompanyId(supabase, user!.id)

  if (!companyId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">清掃会社の登録が必要です。</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  // Today's schedules
  type ScheduleItem = {
    id: string; scheduled_date: string; status: string; checkin_time: string | null;
    properties: { name: string } | null;
    staff_assignments: Array<{ staff: { name: string } | null }>;
  }
  const { data: todaySchedules } = await supabase
    .from('cleaning_schedules')
    .select(`
      id, scheduled_date, status, checkin_time,
      properties(name),
      staff_assignments(staff(name))
    `)
    .eq('cleaning_company_id', companyId)
    .eq('scheduled_date', today)
    .order('checkin_time', { ascending: true }) as unknown as { data: ScheduleItem[] | null }

  // Pending schedules count
  const { count: pendingCount } = await supabase
    .from('cleaning_schedules')
    .select('id', { count: 'exact', head: true })
    .eq('cleaning_company_id', companyId)
    .eq('status', 'pending')

  // In progress count
  const { count: inProgressCount } = await supabase
    .from('cleaning_schedules')
    .select('id', { count: 'exact', head: true })
    .eq('cleaning_company_id', companyId)
    .eq('status', 'in_progress')

  // Staff count
  const { count: staffCount } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })
    .eq('cleaning_company_id', companyId)
    .eq('is_active', true)

  // This month completed
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const monthStart = firstOfMonth.toISOString().split('T')[0]

  const { count: completedThisMonth } = await supabase
    .from('cleaning_schedules')
    .select('id', { count: 'exact', head: true })
    .eq('cleaning_company_id', companyId)
    .eq('status', 'completed')
    .gte('scheduled_date', monthStart)

  return (
    <div>
      <h1 className="page-title mb-6">ダッシュボード</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaySchedules?.length || 0}</p>
              <p className="text-xs text-gray-500">本日の清掃</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(pendingCount || 0) + (inProgressCount || 0)}</p>
              <p className="text-xs text-gray-500">未完了</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedThisMonth || 0}</p>
              <p className="text-xs text-gray-500">今月完了</p>
            </div>
          </div>
        </div>

        <Link href="/company/staff" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{staffCount || 0}</p>
              <p className="text-xs text-gray-500">スタッフ</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's schedule list */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">本日の清掃一覧</h2>
          <Link href="/company/schedules/new" className="text-blue-600 text-sm hover:underline">
            + 新規登録
          </Link>
        </div>

        {todaySchedules && todaySchedules.length > 0 ? (
          <div className="space-y-3">
            {todaySchedules.map((schedule) => (
              <Link
                key={schedule.id}
                href={`/company/schedules/${schedule.id}`}
                className="card block hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {schedule.properties?.name}
                    </p>
                    {schedule.checkin_time && (
                      <p className="text-sm text-gray-500">
                        チェックイン: {schedule.checkin_time}
                      </p>
                    )}
                    {schedule.staff_assignments?.map(
                      (sa, i) => (
                        <p key={i} className="text-xs text-gray-400">
                          {sa.staff?.name}
                        </p>
                      )
                    )}
                  </div>
                  <CleaningStatusBadge status={schedule.status as 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'} />
                </div>
              </Link>
            ))}
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
