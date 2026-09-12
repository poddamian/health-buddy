-- Avatar photo uploaded during onboarding.
alter table profiles add column if not exists avatar_url text;

-- Public bucket: avatar images need to be viewable by the matched buddy
-- without going through our service_role-only API, so unlike every other
-- table here we let Storage serve them directly.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
