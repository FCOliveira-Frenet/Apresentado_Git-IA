create extension if not exists "pgcrypto";

create type public.member_role as enum ('master', 'admin', 'member');
create type public.payment_type as enum ('VA', 'VR', 'DEBITO', 'CREDITO', 'PIX');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha casa',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  status text not null default 'active' check (status in ('active', 'pending')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default 'unidades',
  minimum_quantity numeric not null default 0 check (minimum_quantity >= 0),
  average_price numeric(12,2) not null default 0,
  last_price numeric(12,2) not null default 0,
  storage_location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  purchased_at date not null default current_date,
  store_name text not null,
  total numeric(12,2) not null check (total >= 0),
  payment_type public.payment_type not null,
  payment_method_id uuid,
  category_id uuid references public.categories(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null default 'Lista principal',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  is_purchased boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  type public.payment_type not null,
  provider text not null,
  owner_user_id uuid not null references public.profiles(id),
  last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  type public.payment_type not null check (type in ('VA', 'VR')),
  monthly_amount numeric(12,2) not null default 0,
  initial_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.benefit_transactions (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  occurred_at timestamptz not null default now()
);

create or replace function public.is_family_member(target_family uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members where family_id = target_family and user_id = auth.uid() and status = 'active');
$$;

create or replace function public.is_family_admin(target_family uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members where family_id = target_family and user_id = auth.uid() and status = 'active' and role in ('master', 'admin'));
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário'), new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.payment_methods enable row level security;
alter table public.benefits enable row level security;
alter table public.benefit_transactions enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "family members can view families" on public.families for select using (public.is_family_member(id));
create policy "users can create families" on public.families for insert with check (created_by = auth.uid());
create policy "members can view membership" on public.family_members for select using (public.is_family_member(family_id));
create policy "family admins manage membership" on public.family_members for all using (public.is_family_admin(family_id)) with check (public.is_family_admin(family_id));

create policy "family data access" on public.categories for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "family data access" on public.products for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "family data access" on public.purchases for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "family data access" on public.shopping_lists for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "family data access" on public.payment_methods for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "family data access" on public.benefits for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "purchase items follow purchase" on public.purchase_items for all using (exists (select 1 from public.purchases p where p.id = purchase_id and public.is_family_member(p.family_id))) with check (exists (select 1 from public.purchases p where p.id = purchase_id and public.is_family_member(p.family_id)));
create policy "list items follow list" on public.shopping_list_items for all using (exists (select 1 from public.shopping_lists l where l.id = list_id and public.is_family_member(l.family_id))) with check (exists (select 1 from public.shopping_lists l where l.id = list_id and public.is_family_member(l.family_id)));
create policy "benefit transactions follow benefit" on public.benefit_transactions for all using (exists (select 1 from public.benefits b where b.id = benefit_id and public.is_family_member(b.family_id))) with check (exists (select 1 from public.benefits b where b.id = benefit_id and public.is_family_member(b.family_id)));

-- TUAL portal content is managed separately from private member data.
create type public.tual_role as enum ('visitor', 'member', 'editor', 'admin');

create table public.tual_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role public.tual_role not null default 'visitor',
  created_at timestamptz not null default now()
);

create table public.tual_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.tual_content (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.tual_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  body text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.tual_profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tual_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'evento',
  starts_at timestamptz not null,
  location text,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_by uuid references public.tual_profiles(id),
  created_at timestamptz not null default now()
);

create table public.tual_memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  year integer check (year between 1900 and 2200),
  category text,
  media_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.tual_profiles(id),
  created_at timestamptz not null default now()
);

alter table public.tual_profiles enable row level security;
alter table public.tual_categories enable row level security;
alter table public.tual_content enable row level security;
alter table public.tual_events enable row level security;
alter table public.tual_memories enable row level security;

create policy "public can view published TUAL content" on public.tual_content for select using (status = 'published' or created_by = auth.uid());
create policy "public can view published TUAL events" on public.tual_events for select using (status = 'published' or created_by = auth.uid());
create policy "public can view published TUAL memories" on public.tual_memories for select using (status = 'published' or created_by = auth.uid());
create policy "signed in users can view own TUAL profile" on public.tual_profiles for select using (id = auth.uid());
create policy "admins manage TUAL content" on public.tual_content for all using (exists (select 1 from public.tual_profiles where id = auth.uid() and role in ('editor', 'admin'))) with check (exists (select 1 from public.tual_profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "admins manage TUAL events" on public.tual_events for all using (exists (select 1 from public.tual_profiles where id = auth.uid() and role in ('editor', 'admin'))) with check (exists (select 1 from public.tual_profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "admins manage TUAL memories" on public.tual_memories for all using (exists (select 1 from public.tual_profiles where id = auth.uid() and role in ('editor', 'admin'))) with check (exists (select 1 from public.tual_profiles where id = auth.uid() and role in ('editor', 'admin')));
