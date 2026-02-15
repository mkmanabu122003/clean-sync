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

const InvoicePDF = dynamic(() => import('@/components/pdf/invoice-pdf'), {
  ssr: false,
})

interface InvoiceData {
  id: string
  year: number
  month: number
  total_amount: number
  issued_at: string | null
  users: { name: string }
  cleaning_companies: { name: string }
  invoice_items: Array<{
    property_name: string
    cleaning_date: string
    amount: number
    description: string | null
  }>
}

export default function OwnerInvoicePDFPage() {
  const params = useParams()
  const id = params.id as string
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchInvoice = async () => {
      const { data } = await supabase
        .from('invoices')
        .select(`
          id, year, month, total_amount, issued_at,
          users:owner_user_id(name),
          cleaning_companies(name),
          invoice_items(property_name, cleaning_date, amount, description)
        `)
        .eq('id', id)
        .single()

      setInvoice(data as unknown as InvoiceData)
      setLoading(false)
    }
    fetchInvoice()
  }, [id, supabase])

  if (loading) return <Loading />
  if (!invoice) return <div className="text-center py-12 text-gray-500">請求書が見つかりません</div>

  const pdfProps = {
    invoiceNumber: `INV-${invoice.year}${String(invoice.month).padStart(2, '0')}-${invoice.id.slice(0, 8)}`,
    year: invoice.year,
    month: invoice.month,
    ownerName: invoice.users?.name || '',
    companyName: invoice.cleaning_companies?.name || '',
    issuedAt: invoice.issued_at
      ? new Date(invoice.issued_at).toLocaleDateString('ja-JP')
      : new Date().toLocaleDateString('ja-JP'),
    items: (invoice.invoice_items || [])
      .sort((a, b) => a.cleaning_date.localeCompare(b.cleaning_date))
      .map(item => ({
        cleaning_date: item.cleaning_date,
        property_name: item.property_name,
        amount: Number(item.amount),
        description: item.description || undefined,
      })),
    totalAmount: Number(invoice.total_amount),
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/owner/invoices/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">請求書PDF</h1>
      </div>

      <div className="card text-center py-8">
        <p className="text-lg font-bold mb-2">
          {invoice.year}年{invoice.month}月分 請求書
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {invoice.cleaning_companies?.name}
        </p>

        <PDFDownloadLink
          document={<InvoicePDF {...pdfProps} />}
          fileName={`invoice_${invoice.year}${String(invoice.month).padStart(2, '0')}.pdf`}
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
