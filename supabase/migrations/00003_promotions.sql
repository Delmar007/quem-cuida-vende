/*
  Migration: promotions table
  Stores promotional offers / novelties posted by a store.
*/
create table promotions (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references stores not null,
    product_id uuid references products,
    title text not null,
    description text,
    image_url text,
    price_original numeric,
    price_promotional numeric not null,
    start_at timestamp,
    end_at timestamp,
    type varchar check (type in ('promocao','novidade','outlet')),
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Index for feed queries (by store and recency)
create index idx_promotions_store_created on promotions (store_id, created_at desc);
