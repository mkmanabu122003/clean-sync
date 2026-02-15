'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  userName: string
  role: string
  navigation: { name: string; href: string }[]
}

export default function Header({ userName, role, navigation }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabel = {
    owner: 'オーナー',
    company: '清掃会社',
    staff: 'スタッフ',
  }[role] || role

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href={`/${role}`} className="text-lg font-bold text-blue-600">
              CleanSync
            </Link>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {roleLabel}
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{userName}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 p-2"
              title="ログアウト"
            >
              <LogOut size={18} />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-400 hover:text-gray-600 p-2"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-50"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
