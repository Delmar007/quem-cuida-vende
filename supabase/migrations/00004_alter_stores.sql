/*
  Migration: add plan and subscription_status columns to stores table
  Allows tracking of merchant subscription plan and its status.
*/
alter table stores
  add column plan varchar not null default 'bronze',
  add column subscription_status varchar default 'active';

-- TODO: integrate with payment gateway for future plan upgrades.
