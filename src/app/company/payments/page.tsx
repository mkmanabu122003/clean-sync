import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PaymentStatusBadge } from '@/components/ui/status-badge'
import EmptyState from '@/components/ui/empty-state'

export default async function CompanyPaymentsPage() {
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

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, year, month, total_amount, status,
      staff(name)
    `)
    .eq('cleaning_company_id', member.cleaning_company_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">支払い管理</h1>
        <Link href="/company/invoices" className="btn-secondary text-sm">
          請求管理
        </Link>
      </div>

      {payments && payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment: Record<string, unknown>) => (
            <Link
              key={payment.id as string}
              href={`/company/payments/${payment.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {payment.year as number}年{payment.month as number}月分
                  </p>
                  <p className="text-sm text-gray-500">
                    {(payment.staff as Record<string, unknown>)?.name as string}
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
          title="支払いデータはまだありません"
          description="完了した清掃予定から支払いを集計できます"
        />
      )}
    </div>
  )
}
