import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, MapPin, Clock, Key, BookOpen } from 'lucide-react'
import { CleaningStatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!property) notFound()

  // Get recent schedules for this property
  const { data: schedules } = await supabase
    .from('cleaning_schedules')
    .select(`
      id, scheduled_date, status, checkin_time,
      staff_assignments(staff(name))
    `)
    .eq('property_id', params.id)
    .order('scheduled_date', { ascending: false })
    .limit(20)

  // Get cleaning companies assigned
  const { data: companyLinks } = await supabase
    .from('property_cleaning_companies')
    .select(`
      cleaning_fee,
      cleaning_companies(name)
    `)
    .eq('property_id', params.id)
    .eq('is_active', true)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/owner/properties" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">{property.name}</h1>
        </div>
        <Link
          href={`/owner/properties/${params.id}/edit`}
          className="btn-secondary flex items-center gap-1 text-sm"
        >
          <Edit size={14} />
          編集
        </Link>
      </div>

      {/* Property info */}
      <div className="card mb-6">
        <h2 className="section-title mb-3">物件情報</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">住所</p>
              <p className="text-sm">{property.address}</p>
              {property.map_url && (
                <a
                  href={property.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs hover:underline"
                >
                  地図を開く
                </a>
              )}
            </div>
          </div>

          {property.checkin_time && (
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">チェックイン/アウト</p>
                <p className="text-sm">IN {property.checkin_time} / OUT {property.checkout_time}</p>
              </div>
            </div>
          )}

          {property.entry_method && (
            <div className="flex items-start gap-2">
              <Key size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">入室方法</p>
                <p className="text-sm whitespace-pre-wrap">{property.entry_method}</p>
              </div>
            </div>
          )}

          {property.cleaning_guide && (
            <div className="flex items-start gap-2">
              <BookOpen size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">清掃ガイド</p>
                <p className="text-sm whitespace-pre-wrap">{property.cleaning_guide}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cleaning companies */}
      {companyLinks && companyLinks.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-3">担当清掃会社</h2>
          {companyLinks.map((link: Record<string, unknown>, i: number) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm">{(link.cleaning_companies as Record<string, unknown>)?.name as string}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cleaning calendar/history */}
      <div className="card">
        <h2 className="section-title mb-3">清掃履歴</h2>
        {schedules && schedules.length > 0 ? (
          <div className="space-y-2">
            {schedules.map((schedule: Record<string, unknown>) => (
              <Link
                key={schedule.id as string}
                href={schedule.status === 'completed' ? `/owner/reports/${schedule.id}` : '#'}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{formatDate(schedule.scheduled_date as string)}</p>
                  {(schedule.staff_assignments as Array<Record<string, unknown>>)?.map((sa: Record<string, unknown>, i: number) => (
                    <p key={i} className="text-xs text-gray-500">
                      担当: {(sa.staff as Record<string, unknown>)?.name as string}
                    </p>
                  ))}
                </div>
                <CleaningStatusBadge status={schedule.status as 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">清掃履歴はまだありません</p>
        )}
      </div>
    </div>
  )
}
