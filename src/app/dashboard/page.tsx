'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  totalTenants: number
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
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalUsers: 0,
    totalTemplates: 0,
    totalQrCodes: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Get total tenants
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })

      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get total templates
      const { count: templatesCount } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalTenants: tenantsCount || 0,
        totalUsers: usersCount || 0,
        totalTemplates: templatesCount || 0,
        totalQrCodes: 0,
        recentActivity: [],
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

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
          Overview of your workspace
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Tenants</p>
              <h3 className="text-2xl font-bold">{stats.totalTenants}</h3>
            </div>
          </div>
        </div>
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
              <p className="text-sm font-medium">Total Templates</p>
              <h3 className="text-2xl font-bold">{stats.totalTemplates}</h3>
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