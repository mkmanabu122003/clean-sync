import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PaymentStatusBadge } from '@/components/ui/status-badge'

export default async function CompanyPaymentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()

  const { data: payment } = await supabase
    .from('payments')
    .select(`
      *,
      staff(name),
      cleaning_companies(name),
      payment_items(id, property_name, cleaning_date, amount, expense_amount, description)
    `)
    .eq('id', params.id)
    .single() as unknown as { data: {
      id: string; year: number; month: number; total_amount: number; status: 'draft' | 'confirmed' | 'paid';
      staff: { name: string } | null;
      cleaning_companies: { name: string } | null;
      payment_items: Array<{ id: string; property_name: string; cleaning_date: string; amount: number; expense_amount: number; description: string | null }>;
    } | null }

  if (!payment) notFound()

  const items = payment.payment_items || []
  const cleaningTotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
  const expenseTotal = items.reduce((sum, item) => sum + Number(item.expense_amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/company/payments" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">支払い明細</h1>
        </div>
        <Link
          href={`/company/payments/${params.id}/pdf`}
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
              {payment.year}年{payment.month}月分 支払い明細
            </p>
            <p className="text-sm text-gray-500">
              支払い先: {payment.staff?.name}
            </p>
            <p className="text-sm text-gray-500">
              発行元: {payment.cleaning_companies?.name}
            </p>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {/* Cleaning items */}
        <h3 className="font-medium text-sm text-gray-700 mb-2">清掃報酬</h3>
        <div className="overflow-x-auto mb-4">
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
                    <td className="py-2">{item.property_name}</td>
                    <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={2} className="py-2 font-medium">小計（清掃報酬）</td>
                <td className="py-2 text-right font-medium">{formatCurrency(cleaningTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Expenses */}
        {expenseTotal > 0 && (
          <>
            <h3 className="font-medium text-sm text-gray-700 mb-2">経費</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">日付</th>
                    <th className="text-left py-2 font-medium text-gray-600">内容</th>
                    <th className="text-right py-2 font-medium text-gray-600">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .filter((item) => Number(item.expense_amount) > 0)
                    .map((item) => (
                      <tr key={`exp-${item.id}`} className="border-b border-gray-50">
                        <td className="py-2">{formatDate(item.cleaning_date)}</td>
                        <td className="py-2">{item.description || '経費'}</td>
                        <td className="py-2 text-right">{formatCurrency(item.expense_amount)}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={2} className="py-2 font-medium">小計（経費）</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(expenseTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* Total */}
        <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
          <span className="font-bold">合計</span>
          <span className="text-xl font-bold">{formatCurrency(payment.total_amount)}</span>
        </div>
      </div>
    </div>
  )
}
