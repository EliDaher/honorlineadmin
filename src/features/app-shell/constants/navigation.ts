import {
  Boxes,
  Cable,
  CircleDollarSign,
  ContactRound,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  ShoppingCart,
  ShieldCheck,
  UsersRound,
  Archive
} from 'lucide-react'
import type { ViewKey } from '@/app/_lib/types'

export const navigationItems = [
  { key: 'dashboard', label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'المنتجات', href: '/products', icon: Boxes },
  { key: 'categories', label: 'التصنيفات', href: '/categories', icon: FolderTree },
  { key: 'contacts', label: 'الجهات', href: '/contacts', icon: ContactRound },
  { key: 'workers', label: 'العاملون', href: '/workers', icon: ShieldCheck },
  { key: 'customers', label: 'الزبائن', href: '/customers', icon: UsersRound },
  { key: 'holds', label: 'الأمانات', href: '/holds', icon: Archive },
  { key: 'sales', label: 'المبيعات', href: '/sales', icon: ShoppingCart },
  { key: 'payments', label: 'الدفعات', href: '/payments', icon: CreditCard },
  { key: 'accounting', label: 'المحاسبة', href: '/accounting', icon: CircleDollarSign },
  { key: 'cables', label: 'الكابلات', href: '/cables', icon: Cable }
] satisfies Array<{ key: ViewKey; label: string; href: string; icon: typeof LayoutDashboard }>

export function viewTitle(view: ViewKey) {
  return navigationItems.find((item) => item.key === view)?.label || 'لوحة التحكم'
}
