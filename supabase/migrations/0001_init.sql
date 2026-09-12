-- Health Buddy — initial schema
-- Reconstructed from application code (no prior migrations existed in the repo).
-- Auth model: Clerk handles authentication; the app talks to Supabase only via the
-- service_role key from server-side API routes (see src/app/api/**). No browser code
-- uses the Supabase anon key, so RLS below intentionally grants no policies to
-- anon/authenticated — every table is readable/writable only via service_role.

create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
    id                          uuid primary key default gen_random_uuid(),
    clerk_user_id               text unique not null,
    email                       text,
    name                        text,
    age                         integer,
    habits                      text[] not null default '{}',
    goals                       text[] not null default '{}',
    checkin_time                text,
    timezone                    text,
    streak                      integer not null default 0,
    subscription_tier           text not null default 'free'
                                    check (subscription_tier in ('free', 'premium', 'pro')),
    subscription_status         text,
    subscription_ends_at        timestamptz,
    stripe_customer_id          text,
    is_available_for_matching   boolean not null default true,
    matching_score_last         integer,
    last_rematch_at             timestamptz,
    created_at                  timestamptz not null default now()
);

create index if not exists profiles_clerk_user_id_idx on profiles (clerk_user_id);
create index if not exists profiles_stripe_customer_id_idx on profiles (stripe_customer_id);
create index if not exists profiles_is_available_for_matching_idx on profiles (is_available_for_matching);

-- ── buddies ──────────────────────────────────────────────────────────────
create table if not exists buddies (
    id                      uuid primary key default gen_random_uuid(),
    user1_id                uuid not null references profiles (id) on delete cascade,
    user2_id                uuid not null references profiles (id) on delete cascade,
    compatibility_score     integer,
    matched_by              text default 'algorithm',
    status                  text not null default 'active' check (status in ('active', 'ended')),
    matched_at              timestamptz not null default now()
);

create index if not exists buddies_user1_id_idx on buddies (user1_id);
create index if not exists buddies_user2_id_idx on buddies (user2_id);
create index if not exists buddies_status_idx on buddies (status);

-- ── checkins ─────────────────────────────────────────────────────────────
create table if not exists checkins (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references profiles (id) on delete cascade,
    date                date not null,
    completed           boolean not null default true,
    note                text,
    checked_habits      text[] not null default '{}',
    created_at          timestamptz not null default now(),
    unique (user_id, date)
);

create index if not exists checkins_user_id_idx on checkins (user_id);
create index if not exists checkins_date_idx on checkins (date);

-- ── matching_queue ───────────────────────────────────────────────────────
create table if not exists matching_queue (
    user_id         uuid primary key references profiles (id) on delete cascade,
    joined_at       timestamptz not null default now(),
    habits          text[] not null default '{}',
    checkin_time    text,
    timezone        text
);

-- ── nudges (used by POST /api/buddy/nudge) ─────────────────────────────────
create table if not exists nudges (
    id              uuid primary key default gen_random_uuid(),
    from_user_id    uuid not null references profiles (id) on delete cascade,
    to_user_id      uuid not null references profiles (id) on delete cascade,
    created_at      timestamptz not null default now()
);

create index if not exists nudges_to_user_id_idx on nudges (to_user_id);

-- ── increment_streak RPC (used by POST /api/checkin) ────────────────────
create or replace function increment_streak(user_id uuid)
returns void
language sql
as $$
    update profiles set streak = streak + 1 where id = user_id;
$$;

-- ── Row Level Security ───────────────────────────────────────────────────
-- Every table is locked down to service_role only: no anon/authenticated
-- policies are defined, because all app reads/writes go through server API
-- routes using the service_role key (which bypasses RLS entirely).
alter table profiles enable row level security;
alter table buddies enable row level security;
alter table checkins enable row level security;
alter table matching_queue enable row level security;
alter table nudges enable row level security;
