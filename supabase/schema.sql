create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  role text check (role in ('driver', 'passenger')),
  wallet_address text,
  rating_avg numeric default 0,
  rating_count integer default 0
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users (id) on delete cascade,
  source text not null,
  destination text not null,
  available_seats integer not null default 1,
  status text not null default 'open'
);

create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.users (id) on delete cascade,
  source text not null,
  destination text not null,
  fare_estimate numeric not null,
  status text not null default 'waiting'
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users (id) on delete cascade,
  passenger_id uuid not null references public.users (id) on delete cascade,
  ride_id uuid references public.rides (id) on delete set null,
  fare numeric not null,
  status text not null check (status in ('pending', 'ongoing', 'completed', 'cancelled')),
  algorand_app_id bigint,
  escrow_txn_id text
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  unique (from_user_id, to_user_id, booking_id)
);

