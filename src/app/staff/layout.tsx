import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import BottomNavWrapper from './bottom-nav-wrapper'

const navigation = [
  { name: 'ダッシュボード', href: '/staff' },
  { name: 'カレンダー', href: '/staff/calendar' },
  { name: '支払い', href: '/staff/payments' },
]

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'staff') redirect('/')

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header userName={userData.name} role="staff" navigation={navigation} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNavWrapper />
    </div>
  )
}
