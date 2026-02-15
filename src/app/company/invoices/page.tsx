import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { InvoiceStatusBadge } from '@/components/ui/status-badge'
import EmptyState from '@/components/ui/empty-state'

export default async function CompanyInvoicesPage() {
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

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, year, month, total_amount, status, issued_at,
      users:owner_user_id(name)
    `)
    .eq('cleaning_company_id', member.cleaning_company_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">請求管理</h1>
        <Link href="/company/payments" className="btn-secondary text-sm">
          支払い管理
        </Link>
      </div>

      {invoices && invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((invoice: Record<string, unknown>) => (
            <Link
              key={invoice.id as string}
              href={`/company/invoices/${invoice.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {invoice.year as number}年{invoice.month as number}月分
                  </p>
                  <p className="text-sm text-gray-500">
                    {(invoice.users as Record<string, unknown>)?.name as string} 様
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(invoice.total_amount as number)}
                  </p>
                </div>
                <InvoiceStatusBadge status={invoice.status as 'draft' | 'sent' | 'paid'} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="請求書はまだありません"
          description="完了した清掃予定から請求書を生成できます"
        />
      )}
    </div>
  )
}
