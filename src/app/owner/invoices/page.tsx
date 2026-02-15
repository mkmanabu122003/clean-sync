import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { InvoiceStatusBadge } from '@/components/ui/status-badge'
import EmptyState from '@/components/ui/empty-state'

export default async function OwnerInvoicesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  type InvoiceItem = {
    id: string; year: number; month: number; total_amount: number;
    status: 'draft' | 'sent' | 'paid'; issued_at: string | null;
    cleaning_companies: { name: string } | null;
  }
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, year, month, total_amount, status, issued_at,
      cleaning_companies(name)
    `)
    .eq('owner_user_id', user!.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false }) as unknown as { data: InvoiceItem[] | null }

  return (
    <div>
      <h1 className="page-title mb-6">請求書一覧</h1>

      {invoices && invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/owner/invoices/${invoice.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {invoice.year}年{invoice.month}月分
                  </p>
                  <p className="text-sm text-gray-500">
                    {invoice.cleaning_companies?.name}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(invoice.total_amount)}
                  </p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="請求書はまだありません"
          description="清掃会社からの請求書がここに表示されます"
        />
      )}
    </div>
  )
}
