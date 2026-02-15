import { CleaningStatus, InvoiceStatus, PaymentStatus } from '@/lib/types/database'
import { getStatusLabel, getStatusColor, getInvoiceStatusLabel, getPaymentStatusLabel } from '@/lib/utils'

interface CleaningStatusBadgeProps {
  status: CleaningStatus
}

export function CleaningStatusBadge({ status }: CleaningStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  )
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {getInvoiceStatusLabel(status)}
    </span>
  )
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const colors: Record<PaymentStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {getPaymentStatusLabel(status)}
    </span>
  )
}
