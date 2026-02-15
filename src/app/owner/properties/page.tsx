import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2, MapPin } from 'lucide-react'
import EmptyState from '@/components/ui/empty-state'

export default async function OwnerPropertiesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: propertyOwners } = await supabase
    .from('property_owners')
    .select('property_id')
    .eq('user_id', user!.id)

  const propertyIds = propertyOwners?.map(po => po.property_id) || []

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .in('id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">物件一覧</h1>
        <Link href="/owner/properties/new" className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} />
          新規登録
        </Link>
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/owner/properties/${property.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{property.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-500 truncate">{property.address}</p>
                  </div>
                  {property.checkin_time && property.checkout_time && (
                    <p className="text-xs text-gray-400 mt-1">
                      IN {property.checkin_time} / OUT {property.checkout_time}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="物件がまだ登録されていません"
          description="最初の物件を登録しましょう"
          action={
            <Link href="/owner/properties/new" className="btn-primary text-sm">
              物件を登録
            </Link>
          }
        />
      )}
    </div>
  )
}
