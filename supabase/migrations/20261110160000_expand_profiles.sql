alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone_number text,
  add column if not exists profile_image text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pincode text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists verification_provider text,
  add column if not exists provider_user_id text,
  add column if not exists verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default pg_catalog.now();

alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('unverified', 'pending', 'verified', 'failed'));

alter table public.profiles
  add constraint profiles_verification_provider_check
  check (verification_provider is null or verification_provider in ('digilocker', 'alternative'));

-- Populate profile details for users that already existed before this migration.
update public.profiles as profile
set email = auth_user.email,
    phone_number = coalesce(profile.phone_number, auth_user.phone),
    full_name = coalesce(
      profile.full_name,
      auth_user.raw_user_meta_data ->> 'full_name',
      auth_user.raw_user_meta_data ->> 'name'
    ),
    profile_image = coalesce(profile.profile_image, auth_user.raw_user_meta_data ->> 'avatar_url')
from auth.users as auth_user
where auth_user.id = profile.id;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone_number, profile_image)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

grant update (full_name, email, phone_number, profile_image, address, city, state, pincode)
  on public.profiles to authenticated;

create policy "Citizens can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
