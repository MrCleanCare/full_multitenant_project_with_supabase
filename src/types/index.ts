export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  updated_at: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
  settings: TenantSettings
}

export interface TenantSettings {
  theme: {
    primary_color: string
    logo_url?: string
  }
  features: {
    qr_enabled: boolean
    email_notifications: boolean
    templates_enabled: boolean
  }
}

export interface Template {
  id: string
  tenant_id: string
  name: string
  content: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface TenantUser {
  tenant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
} 