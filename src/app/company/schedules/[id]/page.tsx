import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { CleaningStatusBadge } from '@/components/ui/status-badge'

export default async function ScheduleDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()

  type ScheduleWithRelations = {
    id: string; property_id: string; cleaning_company_id: string; scheduled_date: string;
    status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    checkin_time: string | null; notes: string | null; created_at: string; updated_at: string;
    properties: { name: string; address: string; checkin_time: string | null; checkout_time: string | null } | null;
    staff_assignments: Array<{ id: string; payment_amount: number; staff: { name: string } | null }>;
    schedule_additional_fees: Array<{ id: string; description: string; amount: number; fee_type: string }>;
    cleaning_reports: Array<{
      id: string; notes: string | null; started_at: string | null; completed_at: string | null; submitted_at: string;
      staff: { name: string } | null;
      report_photos: Array<{ id: string; photo_url: string; display_order: number }>;
      checklist_responses: Array<{ id: string; is_checked: boolean; notes: string | null; checklists: { item_name: string } | null }>;
    }>;
  }

  const { data: schedule } = await supabase
    .from('cleaning_schedules')
    .select(`
      *,
      properties(name, address, checkin_time, checkout_time),
      staff_assignments(
        id, payment_amount,
        staff(name)
      ),
      schedule_additional_fees(id, description, amount, fee_type),
      cleaning_reports(
        id, notes, started_at, completed_at, submitted_at,
        staff(name),
        report_photos(id, photo_url, display_order),
        checklist_responses(
          id, is_checked, notes,
          checklists(item_name)
        )
      )
    `)
    .eq('id', params.id)
    .single() as unknown as { data: ScheduleWithRelations | null }

  if (!schedule) notFound()

  const canEdit = schedule.status !== 'completed' && schedule.status !== 'cancelled'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/company/calendar" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">清掃予定詳細</h1>
        </div>
        {canEdit && (
          <Link
            href={`/company/schedules/${params.id}/edit`}
            className="btn-secondary flex items-center gap-1 text-sm"
          >
            <Edit size={14} />
            編集
          </Link>
        )}
      </div>

      {/* Basic info */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">
            {schedule.properties?.name}
          </h2>
          <CleaningStatusBadge status={schedule.status} />
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p>予定日: {formatDate(schedule.scheduled_date)}</p>
          {schedule.checkin_time && <p>チェックイン: {schedule.checkin_time}</p>}
          <p>住所: {schedule.properties?.address}</p>
          {schedule.notes && <p className="mt-2">{schedule.notes}</p>}
        </div>
      </div>

      {/* Staff assignments */}
      <div className="card mb-4">
        <h3 className="font-medium mb-2">担当スタッフ</h3>
        {schedule.staff_assignments?.length > 0 ? (
          <div className="space-y-2">
            {schedule.staff_assignments.map(
              (sa) => (
                <div key={sa.id} className="flex items-center justify-between text-sm">
                  <span>{sa.staff?.name}</span>
                  <span className="text-gray-500">
                    {formatCurrency(sa.payment_amount)}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">スタッフ未アサイン</p>
        )}
      </div>

      {/* Additional fees */}
      {schedule.schedule_additional_fees?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-medium mb-2">追加料金</h3>
          <div className="space-y-2">
            {schedule.schedule_additional_fees.map(
              (fee) => (
                <div key={fee.id} className="flex items-center justify-between text-sm">
                  <span>{fee.description}</span>
                  <span>{formatCurrency(fee.amount)}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Cleaning report */}
      {schedule.cleaning_reports?.length > 0 && (
        <div className="card">
          <h3 className="font-medium mb-3">清掃報告</h3>
          {schedule.cleaning_reports.map(
            (report) => (
              <div key={report.id} className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>
                    報告者: {report.staff?.name}
                  </p>
                  {report.started_at && (
                    <p>
                      作業時間: {formatDate(report.started_at, 'HH:mm')} ~{' '}
                      {report.completed_at ? formatDate(report.completed_at, 'HH:mm') : '進行中'}
                    </p>
                  )}
                  {report.notes && <p className="mt-1">{report.notes}</p>}
                </div>

                {/* Photos */}
                {report.report_photos?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {report.report_photos
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((photo) => (
                        <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.photo_url}
                            alt="清掃写真"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                )}

                {/* Checklist */}
                {report.checklist_responses?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">チェックリスト</h4>
                    {report.checklist_responses.map(
                      (cr) => (
                        <div key={cr.id} className="flex items-center gap-2 text-sm py-1">
                          <span className={cr.is_checked ? 'text-green-500' : 'text-red-400'}>
                            {cr.is_checked ? '✓' : '✗'}
                          </span>
                          <span>
                            {cr.checklists?.item_name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
