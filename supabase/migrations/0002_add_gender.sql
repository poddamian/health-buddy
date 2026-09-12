-- Adds gender to profiles so the UI can use grammatically correct Polish
-- verb/adjective forms (zrobiłeś/zrobiłaś) instead of the "/-a" placeholder.
alter table profiles add column if not exists gender text check (gender in ('m', 'k'));
