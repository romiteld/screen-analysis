import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/app/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardShell
      user={{
        email: user.email,
        user_metadata: user.user_metadata as {
          full_name?: string
          avatar_url?: string
        },
      }}
    >
      {children}
    </DashboardShell>
  )
}
