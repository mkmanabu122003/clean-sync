'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import Loading from '@/components/ui/loading'
import dynamic from 'next/dynamic'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
)

const PaymentPDF = dynamic(() => import('@/components/pdf/payment-pdf'), {
  ssr: false,
})

interface PaymentData {
  id: string
  year: number
  month: number
  total_amount: number
  status: string
  staff: { name: string }
  cleaning_companies: { name: string }
  payment_items: Array<{
    property_name: string
    cleaning_date: string
    amount: number
    expense_amount: number
    description: string | null
  }>
}

export default function PaymentPDFPage() {
  const params = useParams()
  const id = params.id as string
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPayment = async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          id, year, month, total_amount, status,
          staff(name),
          cleaning_companies(name),
          payment_items(property_name, cleaning_date, amount, expense_amount, description)
        `)
        .eq('id', id)
        .single()

      setPayment(data as unknown as PaymentData)
      setLoading(false)
    }
    fetchPayment()
  }, [id, supabase])

  if (loading) return <Loading />
  if (!payment) return <div className="text-center py-12 text-gray-500">支払い明細が見つかりません</div>

  const items = (payment.payment_items || [])
    .sort((a, b) => a.cleaning_date.localeCompare(b.cleaning_date))
    .map(item => ({
      cleaning_date: item.cleaning_date,
      property_name: item.property_name,
      amount: Number(item.amount),
      expense_amount: Number(item.expense_amount),
      description: item.description || undefined,
    }))

  const cleaningTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = items.reduce((sum, item) => sum + item.expense_amount, 0)

  const pdfProps = {
    year: payment.year,
    month: payment.month,
    staffName: payment.staff?.name || '',
    companyName: payment.cleaning_companies?.name || '',
    items,
    cleaningTotal,
    expenseTotal,
    totalAmount: Number(payment.total_amount),
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/company/payments/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">支払い明細PDF</h1>
      </div>

      <div className="card text-center py-8">
        <p className="text-lg font-bold mb-2">
          {payment.year}年{payment.month}月分 支払い明細
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {payment.staff?.name} 様
        </p>

        <PDFDownloadLink
          document={<PaymentPDF {...pdfProps} />}
          fileName={`payment_${payment.year}${String(payment.month).padStart(2, '0')}_${payment.staff?.name}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <button className="btn-primary inline-flex items-center gap-2" disabled={pdfLoading}>
              <Download size={16} />
              {pdfLoading ? 'PDF生成中...' : 'PDFをダウンロード'}
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  )
}
