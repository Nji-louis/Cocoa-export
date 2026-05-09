-- Seed template for product media assets.
-- Edit `product_id` and `storage_path` entries to match uploaded images.
-- Idempotent: uses ON CONFLICT DO NOTHING if `id` PK already exists.

INSERT INTO public.product_media_assets (id, product_id, bucket_name, storage_path, is_primary, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, 'product-media', 'products/0000000000a1/main.jpg', true, now()),
  ('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, 'product-media', 'products/0000000000a1/alt-1.jpg', false, now()),
  ('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-0000000000b2'::uuid, 'product-media', 'products/0000000000b2/main.jpg', true, now())
ON CONFLICT (id) DO NOTHING;
