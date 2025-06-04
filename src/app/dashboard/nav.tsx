'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  QrCode,
  Mail,
} from 'lucide-react'

const items = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Team',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    title: 'Templates',
    href: '/dashboard/templates',
    icon: FileText,
  },
  {
    title: 'QR Codes',
    href: '/dashboard/qr',
    icon: QrCode,
  },
  {
    title: 'Email',
    href: '/dashboard/email',
    icon: Mail,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 p-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === item.href ? 'bg-accent' : 'transparent'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
} 