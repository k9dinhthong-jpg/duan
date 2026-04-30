-- Safe migration: only add new columns, do not modify/remove old data.
-- Requested fields: note, vat, origin

ALTER TABLE product_items
  ADD COLUMN IF NOT EXISTS note VARCHAR(500) NOT NULL DEFAULT '' AFTER contact,
  ADD COLUMN IF NOT EXISTS vat VARCHAR(50) NOT NULL DEFAULT '' AFTER note,
  ADD COLUMN IF NOT EXISTS origin VARCHAR(120) NOT NULL DEFAULT '' AFTER vat;
