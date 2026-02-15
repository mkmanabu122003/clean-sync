import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import BottomNavWrapper from './bottom-nav-wrapper'

const navigation = [
  { name: 'ダッシュボード', href: '/owner' },
  { name: '物件管理', href: '/owner/properties' },
  { name: '請求書', href: '/owner/invoices' },
]

export default async function OwnerLayout({
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

  if (!userData || userData.role !== 'owner') redirect('/')

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header userName={userData.name} role="owner" navigation={navigation} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNavWrapper />
    </div>
  )
}
