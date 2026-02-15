import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import EmptyState from '@/components/ui/empty-state'

export default async function CompanyPropertiesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('cleaning_company_members')
    .select('cleaning_company_id')
    .eq('user_id', user!.id)
    .single()

  if (!member) {
    return <div className="text-center py-12 text-gray-500">清掃会社の登録が必要です。</div>
  }

  const { data: propertyLinks } = await supabase
    .from('property_cleaning_companies')
    .select(`
      id, cleaning_fee, payment_rate,
      properties(id, name, address, checkin_time, checkout_time)
    `)
    .eq('cleaning_company_id', member.cleaning_company_id)
    .eq('is_active', true)

  return (
    <div>
      <h1 className="page-title mb-6">担当物件一覧</h1>

      {propertyLinks && propertyLinks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {propertyLinks.map((link: Record<string, unknown>) => {
            const property = link.properties as Record<string, unknown>
            return (
              <Link
                key={link.id as string}
                href={`/company/properties/${property?.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{property?.name as string}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-500 truncate">{property?.address as string}</p>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>請求: {formatCurrency(link.cleaning_fee as number)}</span>
                      <span>支払: {formatCurrency(link.payment_rate as number)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="担当物件がありません"
          description="オーナーからの招待を待つか、管理者に連絡してください"
        />
      )}
    </div>
  )
}
