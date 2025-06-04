-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "View own tenant memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Insert own tenant membership" ON public.tenant_users;
DROP POLICY IF EXISTS "View tenants as member" ON public.tenants;
DROP POLICY IF EXISTS "Create new tenant" ON public.tenants;
DROP POLICY IF EXISTS "Update tenant as admin" ON public.tenants;
DROP POLICY IF EXISTS "View templates as member" ON public.templates;
DROP POLICY IF EXISTS "Create templates as member" ON public.templates;
DROP POLICY IF EXISTS "Update templates as member" ON public.templates;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies (most permissive since they're basic user info)
CREATE POLICY "Enable read access for all users"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Enable insert for users based on id"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Tenant Users base policies (no recursion)
CREATE POLICY "View own tenant memberships"
ON public.tenant_users FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Insert own tenant membership"
ON public.tenant_users FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Tenants policies
CREATE POLICY "View tenants as member"
ON public.tenants FOR SELECT
USING (
    id IN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Create new tenant"
ON public.tenants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add update policy for tenants
CREATE POLICY "Update tenant as admin"
ON public.tenants FOR UPDATE
USING (EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE tenant_id = id 
    AND user_id = auth.uid() 
    AND role = 'admin'
))
WITH CHECK (EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE tenant_id = id 
    AND user_id = auth.uid() 
    AND role = 'admin'
));

-- Templates policies
CREATE POLICY "View templates as member"
ON public.templates FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Create templates as member"
ON public.templates FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Update templates as member"
ON public.templates FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid()
    )
);

-- Function to get user's tenants (simplified)
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS TABLE (
    tenant_id uuid,
    tenant_name text,
    tenant_slug text,
    user_role text,
    status text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        tu.role as user_role,
        t.status
    FROM tenants t
    INNER JOIN tenant_users tu ON t.id = tu.tenant_id
    WHERE tu.user_id = auth.uid();
$$; 