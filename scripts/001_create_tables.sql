-- Create users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  company_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create contacts table for prospects/clinics
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  name text,
  clinic_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  notes text,
  tags text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create email campaigns table
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  subject text not null,
  content text,
  template_type text default 'email', -- 'email', 'newsletter'
  status text default 'draft', -- 'draft', 'scheduled', 'sent'
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  recipient_count integer default 0,
  open_count integer default 0,
  click_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create campaign recipients table
create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text default 'pending', -- 'pending', 'sent', 'opened', 'clicked'
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create attachments table for documents/whitepapers
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.attachments enable row level security;

-- RLS Policies for users table
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);

-- RLS Policies for contacts table
create policy "contacts_select_own" on public.contacts for select using (auth.uid() = user_id);
create policy "contacts_insert_own" on public.contacts for insert with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.contacts for update using (auth.uid() = user_id);
create policy "contacts_delete_own" on public.contacts for delete using (auth.uid() = user_id);

-- RLS Policies for campaigns table
create policy "campaigns_select_own" on public.campaigns for select using (auth.uid() = user_id);
create policy "campaigns_insert_own" on public.campaigns for insert with check (auth.uid() = user_id);
create policy "campaigns_update_own" on public.campaigns for update using (auth.uid() = user_id);
create policy "campaigns_delete_own" on public.campaigns for delete using (auth.uid() = user_id);

-- RLS Policies for campaign_recipients table
create policy "campaign_recipients_select_own" on public.campaign_recipients for select 
  using (exists(select 1 from public.campaigns where campaigns.id = campaign_recipients.campaign_id and campaigns.user_id = auth.uid()));
create policy "campaign_recipients_insert_own" on public.campaign_recipients for insert 
  with check (exists(select 1 from public.campaigns where campaigns.id = campaign_recipients.campaign_id and campaigns.user_id = auth.uid()));

-- RLS Policies for attachments table
create policy "attachments_select_own" on public.attachments for select using (auth.uid() = user_id);
create policy "attachments_insert_own" on public.attachments for insert with check (auth.uid() = user_id);
create policy "attachments_delete_own" on public.attachments for delete using (auth.uid() = user_id);

-- Create trigger to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'company_name', 'Happy Teeth Support Services')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
