-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- Create enum types
create type tenant_user_role as enum ('owner', 'admin', 'member');

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create tenants table
create table tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug citext not null unique,
  owner_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  settings jsonb default '{
    "theme": {
      "primary_color": "#0ea5e9",
      "logo_url": null
    },
    "features": {
      "qr_enabled": true,
      "email_notifications": true,
      "templates_enabled": true
    }
  }'::jsonb not null
);

-- Create tenant_users table
create table tenant_users (
  tenant_id uuid references tenants on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role tenant_user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (tenant_id, user_id)
);

-- Create templates table
create table templates (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants on delete cascade not null,
  name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users not null
);

-- Create qr_codes table
create table qr_codes (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants on delete cascade not null,
  name text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users not null,
  settings jsonb default '{
    "size": 200,
    "color": "#000000",
    "background": "#ffffff",
    "margin": 4
  }'::jsonb not null
);

-- Create activity_logs table
create table activity_logs (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants on delete cascade not null,
  user_id uuid references auth.users not null,
  type text not null,
  description text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tenants enable row level security;
alter table tenant_users enable row level security;
alter table templates enable row level security;
alter table qr_codes enable row level security;
alter table activity_logs enable row level security;

-- Create policies

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Tenants policies
create policy "Users can view tenants they belong to"
  on tenants for select
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = tenants.id
      and tenant_users.user_id = auth.uid()
    )
  );

create policy "Users can create tenants"
  on tenants for insert
  with check (auth.uid() = owner_id);

create policy "Only tenant owners and admins can update tenants"
  on tenants for update
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = tenants.id
      and tenant_users.user_id = auth.uid()
      and tenant_users.role in ('owner', 'admin')
    )
  );

-- Tenant users policies
create policy "Users can view members of their tenants"
  on tenant_users for select
  using (
    exists (
      select 1 from tenant_users as tu
      where tu.tenant_id = tenant_users.tenant_id
      and tu.user_id = auth.uid()
    )
  );

create policy "Only tenant owners and admins can manage tenant users"
  on tenant_users for all
  using (
    exists (
      select 1 from tenant_users as tu
      where tu.tenant_id = tenant_users.tenant_id
      and tu.user_id = auth.uid()
      and tu.role in ('owner', 'admin')
    )
  );

-- Templates policies
create policy "Users can view templates in their tenants"
  on templates for select
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = templates.tenant_id
      and tenant_users.user_id = auth.uid()
    )
  );

create policy "Users can create templates in their tenants"
  on templates for insert
  with check (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = templates.tenant_id
      and tenant_users.user_id = auth.uid()
    )
  );

create policy "Only template creators and admins can update templates"
  on templates for update
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = templates.tenant_id
      and tenant_users.user_id = auth.uid()
      and (
        tenant_users.role in ('owner', 'admin')
        or templates.created_by = auth.uid()
      )
    )
  );

-- QR codes policies
create policy "Users can view QR codes in their tenants"
  on qr_codes for select
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = qr_codes.tenant_id
      and tenant_users.user_id = auth.uid()
    )
  );

create policy "Users can create QR codes in their tenants"
  on qr_codes for insert
  with check (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = qr_codes.tenant_id
      and tenant_users.user_id = auth.uid()
    )
  );

create policy "Only QR code creators and admins can update QR codes"
  on qr_codes for update
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = qr_codes.tenant_id
      and tenant_users.user_id = auth.uid()
      and (
        tenant_users.role in ('owner', 'admin')
        or qr_codes.created_by = auth.uid()
      )
    )
  );

-- Activity logs policies
create policy "Users can view activity logs in their tenants"
  on activity_logs for select
  using (
    exists (
      select 1 from tenant_users
      where tenant_users.tenant_id = activity_logs.tenant_id
      and tenant_users.user_id = auth.uid()
    )
  );

create policy "System can create activity logs"
  on activity_logs for insert
  with check (auth.uid() = user_id);

-- Create functions and triggers

-- Function to handle tenant updates
create function handle_tenant_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Function to handle template updates
create function handle_template_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Function to handle QR code updates
create function handle_qr_code_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Function to handle profile updates
create function handle_profile_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_tenant_update
  before update on tenants
  for each row
  execute function handle_tenant_update();

create trigger on_template_update
  before update on templates
  for each row
  execute function handle_template_update();

create trigger on_qr_code_update
  before update on qr_codes
  for each row
  execute function handle_qr_code_update();

create trigger on_profile_update
  before update on profiles
  for each row
  execute function handle_profile_update();

-- Create indexes
create index tenant_users_user_id_idx on tenant_users(user_id);
create index tenant_users_tenant_id_idx on tenant_users(tenant_id);
create index templates_tenant_id_idx on templates(tenant_id);
create index qr_codes_tenant_id_idx on qr_codes(tenant_id);
create index activity_logs_tenant_id_idx on activity_logs(tenant_id);
create index activity_logs_user_id_idx on activity_logs(user_id); 