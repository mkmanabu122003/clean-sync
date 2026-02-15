import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CleaningStatus, InvoiceStatus, PaymentStatus } from '@/lib/types/database'

export function formatDate(date: string | Date, fmt: string = 'yyyy/MM/dd'): string {
  return format(new Date(date), fmt, { locale: ja })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getStatusLabel(status: CleaningStatus): string {
  const labels: Record<CleaningStatus, string> = {
    pending: '承認待ち',
    approved: '承認済み',
    in_progress: '清掃中',
    completed: '完了',
    cancelled: 'キャンセル',
  }
  return labels[status]
}

export function getStatusColor(status: CleaningStatus): string {
  const colors: Record<CleaningStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-600',
  }
  return colors[status]
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: '下書き',
    sent: '送付済み',
    paid: '支払い済み',
  }
  return labels[status]
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    draft: '下書き',
    confirmed: '確定',
    paid: '支払い済み',
  }
  return labels[status]
}

export function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    transportation: '交通費',
    supplies: '消耗品',
    other: 'その他',
  }
  return labels[category] || category
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
