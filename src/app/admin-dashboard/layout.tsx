import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import AdminSidebar from '@/components/AdminSidebar'
// @ts-ignore: allow importing global CSS without module declarations in this nested layout
import '../globals.css';

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) {
    // Demo build -- no login wall. Auto-sign-in as the seeded demo admin
    // instead of sending visitors to a credentials form (see
    // /api/demo-auth). Falls back to the real login form on its own if
    // that account doesn't exist yet.
    redirect('/api/demo-auth?redirect=/admin-dashboard')
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif', background: '#ffffff' }}>
        <AdminSidebar user={{ name: (user as any).name, email: user.email || '', role: (user as any).role }}>{children}</AdminSidebar>
      </body>
    </html>
  )
}
