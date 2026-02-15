import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CleaningStatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Building2, Calendar, FileText } from 'lucide-react'

export default async function OwnerDashboard() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get owner's properties
  const { data: propertyOwners } = await supabase
    .from('property_owners')
    .select('property_id')
    .eq('user_id', user!.id)

  const propertyIds = propertyOwners?.map(po => po.property_id) || []

  // Get today's schedules
  type OwnerScheduleItem = {
    id: string; scheduled_date: string; status: string; checkin_time?: string | null;
    properties: { name: string } | null;
    staff_assignments: Array<{ staff: { name: string } | null }>;
  }
  const today = new Date().toISOString().split('T')[0]
  const { data: todaySchedules } = await supabase
    .from('cleaning_schedules')
    .select(`
      id, scheduled_date, status, checkin_time,
      properties(name),
      staff_assignments(staff(name))
    `)
    .in('property_id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('scheduled_date', today)
    .order('checkin_time', { ascending: true }) as unknown as { data: OwnerScheduleItem[] | null }

  // Get recent completed schedules
  const { data: recentSchedules } = await supabase
    .from('cleaning_schedules')
    .select(`
      id, scheduled_date, status,
      properties(name),
      staff_assignments(staff(name))
    `)
    .in('property_id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'completed')
    .order('scheduled_date', { ascending: false })
    .limit(5) as unknown as { data: OwnerScheduleItem[] | null }

  // Get properties count
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .in('id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('is_active', true)

  // Get unpaid invoices
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('id, total_amount')
    .eq('owner_user_id', user!.id)
    .in('status', ['draft', 'sent'])

  const totalUnpaid = unpaidInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0

  return (
    <div>
      <h1 className="page-title mb-6">ダッシュボード</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Link href="/owner/properties" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{properties?.length || 0}</p>
              <p className="text-xs text-gray-500">物件数</p>
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaySchedules?.length || 0}</p>
              <p className="text-xs text-gray-500">本日の清掃</p>
            </div>
          </div>
        </div>

        <Link href="/owner/invoices" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FileText size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</p>
              <p className="text-xs text-gray-500">未払い請求</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's cleaning */}
      <section className="mb-8">
        <h2 className="section-title mb-3">本日の清掃予定</h2>
        {todaySchedules && todaySchedules.length > 0 ? (
          <div className="space-y-3">
            {todaySchedules.map((schedule) => (
              <div key={schedule.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{schedule.properties?.name}</p>
                    <p className="text-sm text-gray-500">
                      {schedule.checkin_time && `チェックイン: ${schedule.checkin_time}`}
                    </p>
                    {schedule.staff_assignments?.map((sa, i) => (
                      <p key={i} className="text-sm text-gray-500">
                        担当: {sa.staff?.name}
                      </p>
                    ))}
                  </div>
                  <CleaningStatusBadge status={schedule.status as 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-400 py-8">
            本日の清掃予定はありません
          </div>
        )}
      </section>

      {/* Recent completed */}
      <section>
        <h2 className="section-title mb-3">最近の完了報告</h2>
        {recentSchedules && recentSchedules.length > 0 ? (
          <div className="space-y-3">
            {recentSchedules.map((schedule) => (
              <Link
                key={schedule.id}
                href={`/owner/reports/${schedule.id}`}
                className="card block hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{schedule.properties?.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(schedule.scheduled_date)}
                    </p>
                  </div>
                  <CleaningStatusBadge status="completed" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-400 py-8">
            完了報告はまだありません
          </div>
        )}
      </section>
    </div>
  )
}
