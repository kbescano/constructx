import type { Metadata } from 'next'
import AdminLoginForm from '@/components/AdminLoginForm'

// This repo is the admin dashboard only -- no public marketing site was
// copied over -- so the bare domain root is the role picker itself, not a
// redirect through it. Always renders the picker regardless of whether
// there's already a session, so the sidebar's "Switch Role" link (and
// Logout) can just point here rather than needing to sign anyone out
// first -- picking a card re-logs-in and overwrites whatever cookie was
// there before.
export const metadata: Metadata = {
  title: 'Explore ConstructX',
  robots: { index: false, follow: false },
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo } = await searchParams
  return <AdminLoginForm redirectTo={redirectTo || '/admin-dashboard'} />
}
