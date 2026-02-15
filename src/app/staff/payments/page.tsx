import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PaymentStatusBadge } from '@/components/ui/status-badge'
import EmptyState from '@/components/ui/empty-state'

export default async function StaffPaymentsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  if (!staffRecord) {
    return <div className="text-center py-12 text-gray-500">スタッフ登録がされていません。</div>
  }

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, year, month, total_amount, status,
      cleaning_companies(name)
    `)
    .eq('staff_id', staffRecord.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return (
    <div>
      <h1 className="page-title mb-6">支払い明細一覧</h1>

      {payments && payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment: Record<string, unknown>) => (
            <Link
              key={payment.id as string}
              href={`/staff/payments/${payment.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {payment.year as number}年{payment.month as number}月分
                  </p>
                  <p className="text-sm text-gray-500">
                    {(payment.cleaning_companies as Record<string, unknown>)?.name as string}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(payment.total_amount as number)}
                  </p>
                </div>
                <PaymentStatusBadge status={payment.status as 'draft' | 'confirmed' | 'paid'} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title="支払い明細はまだありません"
          description="清掃完了後に明細が作成されます"
        />
      )}
    </div>
  )
}
