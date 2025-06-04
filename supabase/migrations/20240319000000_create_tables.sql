-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.templates;
DROP TABLE IF EXISTS public.tenant_users;
DROP TABLE IF EXISTS public.tenants;
DROP TABLE IF EXISTS public.profiles;

-- Create tables
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(email)
);

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'active'::text,
    logo_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(slug)
);

CREATE TABLE public.tenant_users (
    tenant_id uuid REFERENCES public.tenants ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    role text DEFAULT 'member'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE public.templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    content jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_tenant_id ON public.templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tenant_users_updated_at
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 