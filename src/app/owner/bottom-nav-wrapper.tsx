'use client'

import BottomNav from '@/components/layout/bottom-nav'
import { Home, Building2, FileText } from 'lucide-react'

const items = [
  { name: 'ホーム', href: '/owner', icon: Home },
  { name: '物件', href: '/owner/properties', icon: Building2 },
  { name: '請求書', href: '/owner/invoices', icon: FileText },
]

export default function BottomNavWrapper() {
  return <BottomNav items={items} />
}
