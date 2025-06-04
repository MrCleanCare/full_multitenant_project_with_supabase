'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  totalTemplates: number
  totalQrCodes: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    created_at: string
  }>
}

export default function DashboardPage() {
  const { currentTenant } = useTenant()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTemplates: 0,
    totalQrCodes: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentTenant) {
      fetchDashboardStats()
    }
  }, [currentTenant])

  const fetchDashboardStats = async () => {
    try {
      const [usersCount, templatesCount, qrCodesCount, activity] = await Promise.all([
        supabase
          .from('tenant_users')
          .select('*', { count: 'exact' })
          .eq('tenant_id', currentTenant?.id),
        supabase
          .from('templates')
          .select('*', { count: 'exact' })
          .eq('tenant_id', currentTenant?.id),
        supabase
          .from('qr_codes')
          .select('*', { count: 'exact' })
          .eq('tenant_id', currentTenant?.id),
        supabase
          .from('activity_logs')
          .select('*')
          .eq('tenant_id', currentTenant?.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        totalUsers: usersCount.count || 0,
        totalTemplates: templatesCount.count || 0,
        totalQrCodes: qrCodesCount.count || 0,
        recentActivity: activity.data || [],
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentTenant) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome to your dashboard</h2>
          <p className="mt-2 text-muted-foreground">
            Create or select a workspace to get started
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your workspace {currentTenant.name}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Templates</p>
              <h3 className="text-2xl font-bold">{stats.totalTemplates}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">QR Codes</p>
              <h3 className="text-2xl font-bold">{stats.totalQrCodes}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border">
        <div className="p-6">
          <h4 className="text-xl font-semibold">Recent Activity</h4>
          <div className="mt-4 space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
                <span className="text-sm capitalize">{activity.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 