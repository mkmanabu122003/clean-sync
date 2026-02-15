import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CleaningStatusBadge } from '@/components/ui/status-badge'

export default async function OwnerReportPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()

  type ScheduleData = {
    id: string; scheduled_date: string; status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    checkin_time: string | null; notes: string | null;
    properties: { name: string; address: string } | null;
    staff_assignments: Array<{ staff: { name: string } | null }>;
  }

  type ReportData = {
    id: string; notes: string | null; started_at: string | null; completed_at: string | null; submitted_at: string;
    staff: { name: string } | null;
    report_photos: Array<{ id: string; photo_url: string; display_order: number }>;
    checklist_responses: Array<{ id: string; is_checked: boolean; notes: string | null; checklists: { item_name: string } | null }>;
  }

  const { data: schedule } = await supabase
    .from('cleaning_schedules')
    .select(`
      id, scheduled_date, status, checkin_time, notes,
      properties(name, address),
      staff_assignments(staff(name))
    `)
    .eq('id', params.id)
    .single() as unknown as { data: ScheduleData | null }

  if (!schedule) notFound()

  // Get cleaning report
  const { data: reports } = await supabase
    .from('cleaning_reports')
    .select(`
      id, notes, started_at, completed_at, submitted_at,
      staff(name),
      report_photos(id, photo_url, display_order),
      checklist_responses(
        id, is_checked, notes,
        checklists(item_name)
      )
    `)
    .eq('cleaning_schedule_id', params.id) as unknown as { data: ReportData[] | null }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">清掃報告</h1>
      </div>

      {/* Schedule info */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">
            {schedule.properties?.name}
          </h2>
          <CleaningStatusBadge status={schedule.status} />
        </div>
        <p className="text-sm text-gray-500">{formatDate(schedule.scheduled_date)}</p>
        {schedule.notes && (
          <p className="text-sm text-gray-600 mt-2">{schedule.notes}</p>
        )}
        {schedule.staff_assignments?.map(
          (sa, i) => (
            <p key={i} className="text-sm text-gray-500 mt-1">
              担当: {sa.staff?.name}
            </p>
          )
        )}
      </div>

      {/* Reports */}
      {reports && reports.length > 0 ? (
        reports.map((report) => (
          <div key={report.id} className="space-y-4">
            {/* Time info */}
            <div className="card">
              <h3 className="font-medium mb-2">作業時間</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={14} />
                <span>
                  {report.started_at
                    ? formatDate(report.started_at, 'HH:mm')
                    : '--:--'}
                  {' ~ '}
                  {report.completed_at
                    ? formatDate(report.completed_at, 'HH:mm')
                    : '--:--'}
                </span>
              </div>
              {report.notes && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                  {report.notes}
                </p>
              )}
            </div>

            {/* Photos */}
            {report.report_photos?.length > 0 && (
              <div className="card">
                <h3 className="font-medium mb-3">写真</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {report.report_photos
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photo_url}
                          alt="清掃写真"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {report.checklist_responses?.length > 0 && (
              <div className="card">
                <h3 className="font-medium mb-3">チェックリスト</h3>
                <div className="space-y-2">
                  {report.checklist_responses.map(
                    (response) => (
                      <div
                        key={response.id}
                        className="flex items-start gap-2"
                      >
                        {response.is_checked ? (
                          <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm">
                            {response.checklists?.item_name}
                          </p>
                          {response.notes && (
                            <p className="text-xs text-gray-500">{response.notes}</p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="card text-center text-gray-400 py-8">
          報告はまだ提出されていません
        </div>
      )}
    </div>
  )
}
