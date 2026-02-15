'use client'

import BottomNav from '@/components/layout/bottom-nav'
import { Home, Calendar, Wallet } from 'lucide-react'

const items = [
  { name: 'ホーム', href: '/staff', icon: Home },
  { name: 'カレンダー', href: '/staff/calendar', icon: Calendar },
  { name: '支払い', href: '/staff/payments', icon: Wallet },
]

export default function BottomNavWrapper() {
  return <BottomNav items={items} />
}
