import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import CreateTenantForm from '../../components/CreateTenantForm'

export default function Dashboard() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [userDetails, setUserDetails] = useState(null)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/')
      return
    }

    const loadUserData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                avatar_url: session.user.user_metadata?.avatar_url || '',
                email: session.user.email
              }])
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              throw createError
            }
            setUserDetails(newProfile)
          } else {
            console.error('Error fetching profile:', profileError)
            throw profileError
          }
        } else {
          setUserDetails(profile)
        }

        // Get user's tenants using the RPC function
        const { data: tenantsData, error: tenantsError } = await supabase
          .rpc('get_user_tenants')

        if (tenantsError) {
          console.error('Error fetching tenants:', tenantsError)
          throw tenantsError
        }

        setTenants(tenantsData || [])
      } catch (err) {
        console.error('Error loading user data:', err)
        setError(err.message || 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [session, supabase, router])

  if (!session) {
    return (
      <div className="container loading">
        <p>Redirecting to login...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container loading">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error" style={{ 
          color: 'red', 
          border: '1px solid red', 
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <p><strong>Error:</strong> {error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '50px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button 
          onClick={async () => {
            try {
              await supabase.auth.signOut()
              router.push('/')
            } catch (err) {
              console.error('Error signing out:', err)
              setError('Failed to sign out. Please try again.')
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Profile</h2>
        {userDetails && (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p><strong>Name:</strong> {userDetails.full_name || 'Not set'}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Role:</strong> {userDetails.role || 'User'}</p>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Tenants</h2>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Cancel' : 'Create New Tenant'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{ marginBottom: '30px' }}>
            <CreateTenantForm onSuccess={() => {
              setShowCreateForm(false)
              window.location.reload()
            }} />
          </div>
        )}

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {tenants.map((tenant) => (
            <div
              key={tenant.tenant_id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{tenant.tenant_name}</h3>
              <p style={{ margin: '5px 0' }}><strong>Role:</strong> {tenant.user_role}</p>
              <p style={{ margin: '5px 0' }}><strong>Status:</strong> {tenant.status}</p>
              <button
                onClick={() => router.push(`/client/${tenant.tenant_slug}`)}
                style={{
                  marginTop: '15px',
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Access Tenant
              </button>
            </div>
          ))}
          {tenants.length === 0 && !showCreateForm && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px' }}>
              <p>You don't have any tenants yet. Create your first tenant to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 