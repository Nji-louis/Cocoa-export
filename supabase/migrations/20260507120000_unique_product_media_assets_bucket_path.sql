begin;

create unique index if not exists uq_product_media_assets_bucket_path
  on public.product_media_assets(bucket_name, storage_path);

commit;
