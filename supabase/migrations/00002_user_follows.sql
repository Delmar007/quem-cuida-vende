/*
  Migration: user_follows table
  Stores many‑to‑many relationship between a consumer (auth user) and a store (lojista).
  Added unique constraint to prevent duplicate follows.
*/
create table user_follows (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    store_id uuid references stores not null,
    created_at timestamp default now(),
    unique (user_id, store_id)
);
