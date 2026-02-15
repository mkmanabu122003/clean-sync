import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { InvoiceStatusBadge } from '@/components/ui/status-badge'

export default async function CompanyInvoiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()

  const { data: invoiceData } = await supabase
    .from('invoices')
    .select(`
      *,
      users:owner_user_id(name, email),
      cleaning_companies(name),
      invoice_items(id, property_name, cleaning_date, amount, description)
    `)
    .eq('id', params.id)
    .single()

  const invoice = invoiceData as unknown as {
    id: string; year: number; month: number; total_amount: number;
    status: 'draft' | 'sent' | 'paid'; issued_at: string | null;
    users: { name: string; email: string };
    cleaning_companies: { name: string };
    invoice_items: Array<{ id: string; property_name: string; cleaning_date: string; amount: number; description: string | null }>;
  } | null

  if (!invoice) notFound()

  const items = invoice.invoice_items || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/company/invoices" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">請求書詳細</h1>
        </div>
        <Link
          href={`/company/invoices/${params.id}/pdf`}
          className="btn-primary flex items-center gap-1 text-sm"
        >
          <Download size={14} />
          PDF出力
        </Link>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold">
              {invoice.year}年{invoice.month}月分 請求書
            </p>
            <p className="text-sm text-gray-500">
              請求先: {(invoice.users as Record<string, unknown>)?.name as string} 様
            </p>
            <p className="text-sm text-gray-500">
              発行元: {(invoice.cleaning_companies as Record<string, unknown>)?.name as string}
            </p>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {invoice.issued_at && (
          <p className="text-sm text-gray-500 mb-4">
            発行日: {formatDate(invoice.issued_at)}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">日付</th>
                <th className="text-left py-2 font-medium text-gray-600">物件名</th>
                <th className="text-right py-2 font-medium text-gray-600">金額</th>
              </tr>
            </thead>
            <tbody>
              {items
                .sort((a, b) => a.cleaning_date.localeCompare(b.cleaning_date))
                .map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2">{formatDate(item.cleaning_date)}</td>
                    <td className="py-2">
                      {item.property_name}
                      {item.description && (
                        <span className="text-xs text-gray-400 block">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={2} className="py-3 font-bold">合計</td>
                <td className="py-3 text-right font-bold text-lg">
                  {formatCurrency(invoice.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Status change */}
      <div className="card">
        <h3 className="font-medium mb-3">ステータス変更</h3>
        <div className="flex gap-2">
          <form action={`/api/invoices/${params.id}/status`} method="POST">
            <input type="hidden" name="status" value="sent" />
            <button type="submit" className="btn-primary text-sm" disabled={invoice.status !== 'draft'}>
              送付済みにする
            </button>
          </form>
          <form action={`/api/invoices/${params.id}/status`} method="POST">
            <input type="hidden" name="status" value="paid" />
            <button type="submit" className="btn-secondary text-sm" disabled={invoice.status === 'paid'}>
              支払い済みにする
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
