import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Key, BookOpen } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function CompanyPropertyDetailPage({
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

  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('cleaning_company_members')
    .select('cleaning_company_id')
    .eq('user_id', user!.id)
    .single()

  const { data: pcc } = await supabase
    .from('property_cleaning_companies')
    .select('cleaning_fee, payment_rate')
    .eq('property_id', params.id)
    .eq('cleaning_company_id', member!.cleaning_company_id)
    .single()

  // Get checklists
  const { data: checklists } = await supabase
    .from('checklists')
    .select('*')
    .eq('cleaning_company_id', member!.cleaning_company_id)
    .or(`property_id.is.null,property_id.eq.${params.id}`)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/company/properties" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">{property.name}</h1>
      </div>

      {/* Property info */}
      <div className="card mb-4">
        <h2 className="section-title mb-3">物件情報</h2>
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

          {property.checkin_time && (
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm">IN {property.checkin_time} / OUT {property.checkout_time}</p>
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

      {/* Pricing */}
      {pcc && (
        <div className="card mb-4">
          <h2 className="section-title mb-3">単価設定</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">請求単価（オーナー向け）</p>
              <p className="text-lg font-bold">{formatCurrency(pcc.cleaning_fee)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">支払い単価（スタッフ向け）</p>
              <p className="text-lg font-bold">{formatCurrency(pcc.payment_rate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Checklists */}
      <div className="card">
        <h2 className="section-title mb-3">チェックリスト</h2>
        {checklists && checklists.length > 0 ? (
          <div className="space-y-2">
            {checklists.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400">☐</span>
                <span>{item.item_name}</span>
                {item.property_id ? (
                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">物件固有</span>
                ) : (
                  <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">共通</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">チェックリストが未設定です</p>
        )}
      </div>
    </div>
  )
}
