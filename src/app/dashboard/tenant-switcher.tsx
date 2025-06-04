'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTenant } from '@/hooks/use-tenant'
import { useRouter } from 'next/navigation'

export function TenantSwitcher() {
  const [open, setOpen] = React.useState(false)
  const { tenants, currentTenant, switchTenant } = useTenant()
  const router = useRouter()

  const handleSelect = (tenant: any) => {
    switchTenant(tenant)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent',
          open ? 'bg-accent' : 'bg-background'
        )}
        onClick={() => setOpen(!open)}
      >
        {currentTenant?.name || 'Select a workspace'}
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[200px] rounded-md border bg-popover p-2 shadow-md">
          <div className="space-y-1">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                  currentTenant?.id === tenant.id ? 'bg-accent' : 'transparent'
                )}
                onClick={() => handleSelect(tenant)}
              >
                {tenant.name}
                {currentTenant?.id === tenant.id && <Check className="h-4 w-4" />}
              </button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false)
                router.push('/dashboard/new-tenant')
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 