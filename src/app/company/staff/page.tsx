import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, User } from 'lucide-react'
import EmptyState from '@/components/ui/empty-state'

export default async function CompanyStaffPage() {
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

  const { data: staffList } = await supabase
    .from('staff')
    .select('*')
    .eq('cleaning_company_id', member.cleaning_company_id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">スタッフ管理</h1>
        <Link href="/company/staff/new" className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} />
          新規登録
        </Link>
      </div>

      {staffList && staffList.length > 0 ? (
        <div className="space-y-3">
          {staffList.map((staff) => (
            <Link
              key={staff.id}
              href={`/company/staff/${staff.id}/edit`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <User size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">{staff.name}</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {staff.phone && <span>{staff.phone}</span>}
                    {staff.email && <span>{staff.email}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="スタッフが登録されていません"
          description="清掃スタッフを登録しましょう"
          action={
            <Link href="/company/staff/new" className="btn-primary text-sm">
              スタッフを登録
            </Link>
          }
        />
      )}
    </div>
  )
}
