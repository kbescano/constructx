'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import OnboardingTip, { startTipsTour } from '@/components/onboarding/OnboardingTip'

// Updated to use a 'roles' array for granular access control
const NAV_ITEMS = [
  { href: '/admin-dashboard', label: 'Quotation Inbox', roles: ['admin','user'] },
  { href: '/admin-dashboard/sales-report', label: 'Sales Report', roles: ['user'] },
  { href: '/admin-dashboard/inquiry-tracker', label: 'Inquiry Tracker', roles: ['admin','marketing'] },
  { href: '/admin-dashboard/deliveries', label: 'Logistics', roles: ['admin','marketing'] },
  { href: '/admin-dashboard/clients', label: 'Clients', roles: ['marketing'] },
  { href: '/admin-dashboard/suppliers', label: 'Suppliers', roles: ['marketing'] },
  { href: '/admin-dashboard/client-quotation', label: 'Client Quotation', roles: ['admin'] },
  { href: '/admin-dashboard/orders', label: 'Orders', roles: ['admin'] },
  { href: '/admin-dashboard/supplier-po', label: 'Supplier PO', roles: ['admin'] },
  { href: '/admin-dashboard/reports', label: 'Reports', roles: ['admin'] },
]

// Hover hints for every nav tab. Keyed by href so they only render for
// items actually in NAV_ITEMS above.
const NAV_TIPS: Record<string, string> = {
  '/admin-dashboard': 'Start here — every inquiry lands in this inbox first.',
  '/admin-dashboard/sales-report': 'Your own performance: quotas, conversions, and order breakdowns.',
  '/admin-dashboard/inquiry-tracker': 'Every rep\'s inquiries in one workload view — filter by staff or status.',
  '/admin-dashboard/deliveries': 'Route plans and waybills for confirmed orders — pickup, drop-off, driver.',
  '/admin-dashboard/clients': 'The client directory — company, contact info, and status.',
  '/admin-dashboard/suppliers': 'The supplier directory — who you buy from, and their contact info.',
  '/admin-dashboard/client-quotation': 'Every quotation sent to a client, from draft through order-confirmed.',
  '/admin-dashboard/orders': 'Confirmed orders — fulfillment, payment, and profit per order.',
  '/admin-dashboard/supplier-po': 'Purchase orders issued to suppliers, and their fulfillment status.',
  '/admin-dashboard/reports': 'Company-wide revenue, profit, and staff performance.',
}

type AdminUser = { name?: string; email: string; role?: string }

export default function AdminLayout({
  children,
  user,
}: {
  children: React.ReactNode
  user?: AdminUser
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const displayName = user?.name?.trim() || user?.email
  const isAdmin = user?.role === 'admin'
  const userRole = user?.role || 'user'

  // Filter nav items based on the user's exact role
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(userRole)) return false
    return true
  })

  async function handleLogout() {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // proceed to redirect regardless
    }
    // Sends them back to the role picker at '/' rather than a dead-end
    // credentials form -- logging out doubles as "switch which role I'm
    // exploring as."
    window.location.href = '/?redirect=/admin-dashboard'
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top bar ===== */}
      <header className="admin-header sticky top-0 z-40 bg-white border-b border-[#050505]/10">
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 h-16">
          <div className="flex items-center gap-3">
            <p className="text-[14px] sm:text-[16px] font-black uppercase tracking-tight text-[#050505] leading-none truncate">
              Dashboard
            </p>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              const link = (
                <Link
                  href={item.href}
                  className={`flex items-center h-full px-2 text-[8px] font-bold uppercase tracking-[0.08em] border-b-2 transition-colors duration-200 ${
                    isActive
                      ? 'border-[#1877F2] text-[#050505]'
                      : 'border-transparent text-[#050505]/40 hover:text-[#050505] hover:border-[#050505]/15'
                  }`}
                >
                  {item.label}
                </Link>
              )
              const tip = NAV_TIPS[item.href]
              return (
                <span key={item.href} className="h-full">
                  {tip ? (
                    <OnboardingTip id={`nav-${item.href}`} text={tip} wrapperClassName="inline-block h-full">
                      {link}
                    </OnboardingTip>
                  ) : (
                    link
                  )}
                </span>
              )
            })}
            <Link
              href="/?redirect=/admin-dashboard"
              className="ml-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#050505]/35 hover:text-[#1877F2] transition-colors"
            >
              &larr; Switch Role
            </Link>
            <div className="ml-2 pl-2 border-l border-[#050505]/10">
              <NotificationBell role={isAdmin ? "admin" : "user"} />
            </div>
          </nav>

          {/* Mobile: bell + hamburger */}
          <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
          <NotificationBell role={isAdmin ? "admin" : "user"} />
          <button
            className="flex items-center justify-center w-10 h-10 flex-shrink-0"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1.5 w-6 h-[15px] justify-center">
              <span className={`block h-[2px] w-full bg-[#050505] transition-transform ${open ? 'translate-y-[6.5px] rotate-45' : ''}`} />
              <span className={`block h-[2px] w-full bg-[#050505] transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-[2px] w-full bg-[#050505] transition-transform ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
            </span>
          </button>
          </div>
        </div>
      </header>

      {/* ===== User bar ===== */}
      {user && (
        <div className="admin-header bg-[#f4f6f2] border-b border-[#050505]/10">
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 h-11">
            <span className="flex items-center gap-2 text-[12px] font-bold text-[#050505]/60 truncate">
              Signed in as {displayName}
              {user.role && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-[#1877F2]/10 text-[#0A4FB0] flex-shrink-0">
                  {user.role}
                </span>
              )}
            </span>
            <span className="flex items-center gap-4 flex-shrink-0">
              {/* Two ways to see tips: hover anything directly, or click
                  this to walk every tip on the page top-to-bottom, one at
                  a time -- useful on touch devices, where hover doesn't
                  exist, and for anyone who'd rather not go hunting for
                  what's hoverable. The pulse is what makes the entry point
                  itself noticeable. */}
              <button
                type="button"
                onClick={() => startTipsTour()}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1877F2] hover:text-[#0A4FB0] transition-colors"
                title="Walk through every tip on this page, one at a time"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1877F2] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1877F2]" />
                </span>
                Show tips
              </button>
              <button
                onClick={handleLogout}
                className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#050505]/40 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </span>
          </div>
        </div>
      )}

      {/* ===== Mobile full-screen overlay ===== */}
      {open && (
        <div className="admin-header md:hidden fixed inset-0 bg-white z-50 flex flex-col px-6 pt-8 pb-10 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <p className="text-[16px] font-black uppercase tracking-tight text-[#050505]">Dashboard</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`py-3.5 text-[20px] font-black uppercase tracking-tight border-b border-[#050505]/10 ${
                    isActive ? 'text-[#1877F2]' : 'text-[#050505]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/?redirect=/admin-dashboard"
              onClick={() => setOpen(false)}
              className="py-3.5 text-[14px] font-bold uppercase tracking-wide text-[#050505]/40"
            >
              &larr; Switch Role
            </Link>
          </nav>
        </div>
      )}

      {/* ===== Main content ===== */}
      <main className="flex-1 min-w-0 bg-[#fbfbfd] p-6 md:p-10">
        {children}
      </main>

      <style>{`
        @media print {
          .admin-header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}