'use client'

import BottomNav from '@/components/layout/bottom-nav'
import { Home, Calendar, Building2, Users, FileText } from 'lucide-react'

const items = [
  { name: 'ホーム', href: '/company', icon: Home },
  { name: 'カレンダー', href: '/company/calendar', icon: Calendar },
  { name: '物件', href: '/company/properties', icon: Building2 },
  { name: 'スタッフ', href: '/company/staff', icon: Users },
  { name: '請求/支払', href: '/company/invoices', icon: FileText },
]

export default function BottomNavWrapper() {
  return <BottomNav items={items} />
}
