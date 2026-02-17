begin;

-- Categories inferred from product/export pages
insert into public.product_categories (slug, name, description, display_order, status)
values
  ('cocoa-beans', 'Cocoa Beans', 'Export-grade cocoa bean varieties for global buyers.', 1, 'published'),
  ('specialty-cocoa', 'Specialty Cocoa', 'Premium and differentiated cocoa programs.', 2, 'published'),
  ('processed-cocoa', 'Processed Cocoa', 'Processed cocoa derivatives for industry.', 3, 'published')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  status = excluded.status;

-- Product catalog inferred from product pages
with categories as (
  select id, slug from public.product_categories
)
insert into public.products (
  category_id,
  slug,
  name,
  short_description,
  description,
  origin_country,
  flavor_notes,
  is_featured,
  is_popular,
  is_new_arrival,
  status,
  published_at
)
values
  ((select id from categories where slug = 'cocoa-beans'), 'amelonado', 'Premium Amelonado Cocoa Beans from Cameroon', 'Classic West African cocoa profile with balanced flavor and consistent export specifications.', 'CHOCOCAM S.A.R.L exports carefully selected Amelonado cocoa beans with traceable lot handling and export documentation support.', 'Cameroon', array['balanced', 'nutty', 'classic profile']::text[], true, false, false, 'published', now()),
  ((select id from categories where slug = 'cocoa-beans'), 'bresilien', 'Cacao Bresilien Beans for International Buyers', 'Imported Cacao Bresilien beans available through CHOCOCAM with reliable export logistics.', 'Cacao Bresilien lots offered for buyers requiring specific bean programs and dependable export coordination.', 'Cameroon', array['intense cocoa', 'blend-friendly']::text[], true, false, false, 'published', now()),
  ((select id from categories where slug = 'specialty-cocoa'), 'cundeamor', 'Specialty Cundeamor Cocoa Beans from Cameroon', 'Distinct cocoa beans with nuanced flavor for specialty and premium chocolate programs.', 'Specialty Cundeamor offerings built for premium manufacturers requiring differentiated flavor profiles.', 'Cameroon', array['nuanced', 'specialty', 'aromatic']::text[], true, false, false, 'published', now()),
  ((select id from categories where slug = 'cocoa-beans'), 'forastero', 'Export-Grade Forastero Cocoa Beans from Cameroon', 'Robust, high-yield cocoa beans with consistent fermentation and strong cocoa flavor for bulk manufacturing.', 'Forastero container programs with lot-level traceability, quality checks, and annual contract support.', 'Cameroon', array['robust', 'deep cocoa', 'high yield']::text[], false, true, true, 'published', now()),
  ((select id from categories where slug = 'specialty-cocoa'), 'criollo', 'Premium Criollo Cocoa Beans from Cameroon', 'Rare, high-quality Criollo cocoa beans with smooth flavor for gourmet chocolate makers.', 'Criollo micro-lots and contract volumes with strict origin traceability and export document readiness.', 'Cameroon', array['smooth', 'premium', 'low bitterness']::text[], false, true, true, 'published', now()),
  ((select id from categories where slug = 'specialty-cocoa'), 'trinitario', 'Premium Trinitario Cocoa Beans from Cameroon', 'Export-grade Trinitario cocoa beans sourced from trusted farmer cooperatives.', 'Trinitario lots with balanced cocoa body, aromatic depth, and controlled post-harvest processing.', 'Cameroon', array['balanced', 'aromatic', 'fruit notes']::text[], false, true, true, 'published', now()),
  ((select id from categories where slug = 'cocoa-beans'), 'premium-raw-cocoa-beans', 'Premium Raw Cocoa Beans', 'High-quality cocoa beans carefully sourced and fermented for superior flavor and consistency.', 'Raw cocoa bean program for international industrial processors and chocolate manufacturers.', 'Cameroon', array['raw', 'industrial', 'consistent']::text[], false, false, false, 'published', now()),
  ((select id from categories where slug = 'cocoa-beans'), 'fermented-dried-cocoa', 'Fermented and Dried Cocoa', 'Export-grade cocoa professionally fermented and dried for international markets.', 'Fermented and dried cocoa lots aligned with export moisture and grading requirements.', 'Cameroon', array['fermented', 'dried', 'aromatic']::text[], false, false, false, 'published', now()),
  ((select id from categories where slug = 'specialty-cocoa'), 'organic-sustainable-cocoa', 'Organic and Sustainable Cocoa', 'Ethically sourced cocoa from certified farms with full traceability.', 'Organic and sustainability-focused procurement option for premium ethical sourcing programs.', 'Cameroon', array['organic', 'traceable', 'sustainable']::text[], false, false, false, 'published', now()),
  ((select id from categories where slug = 'cocoa-beans'), 'bulk-cocoa-supplies', 'Bulk Cocoa Supplies', 'Large-volume cocoa shipments for wholesalers and global traders.', 'Bulk contract programs with flexible packaging and shipment scheduling.', 'Cameroon', array['bulk', 'contract', 'logistics']::text[], false, false, false, 'published', now()),
  ((select id from categories where slug = 'processed-cocoa'), 'cocoa-butter', 'Cocoa Butter', 'High-quality cocoa butter suitable for food, cosmetics, and pharmaceutical applications.', 'Processed cocoa butter supply chain integrated with export documentation and quality controls.', 'Cameroon', array['processed', 'food-grade', 'industrial']::text[], false, false, false, 'published', now()),
  ((select id from categories where slug = 'processed-cocoa'), 'cocoa-powder', 'Cocoa Powder', 'Finely processed cocoa powder with consistent flavor and aroma.', 'Cocoa powder offerings for confectionery, beverage, and food manufacturing clients.', 'Cameroon', array['processed', 'powder', 'consistent']::text[], false, false, false, 'published', now())
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  origin_country = excluded.origin_country,
  flavor_notes = excluded.flavor_notes,
  is_featured = excluded.is_featured,
  is_popular = excluded.is_popular,
  is_new_arrival = excluded.is_new_arrival,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

-- Core product specs aligned with site content
insert into public.product_specifications (product_id, spec_key, spec_value, unit, sort_order)
select p.id, s.spec_key, s.spec_value, s.unit, s.sort_order
from public.products p
join (
  values
    ('moisture_max', '7.5', '%', 1),
    ('bean_count_range', '95-110', 'beans/100g', 2),
    ('fermentation_index_min', '70', '%', 3),
    ('foreign_matter_max', '1.0', '%', 4),
    ('origin_ports', 'Douala Port / Kribi Deep Seaport', null, 5)
) as s(spec_key, spec_value, unit, sort_order)
  on true
where p.slug in ('amelonado', 'bresilien', 'cundeamor', 'forastero', 'criollo', 'trinitario')
on conflict (product_id, spec_key, sort_order) do update
set
  spec_value = excluded.spec_value,
  unit = excluded.unit,
  updated_at = now();

-- Active listings
insert into public.inventory_listings (
  product_id,
  listing_code,
  available_quantity_mt,
  minimum_order_mt,
  price_usd_per_mt,
  incoterm,
  origin_port,
  destination_region,
  harvest_season,
  status,
  valid_until
)
values
  ((select id from public.products where slug = 'amelonado'), 'CHO-AMEL-2026-Q1', 480.000, 24.000, 3050.00, 'FOB', 'Douala Port', 'EU', '2025/2026', 'active', current_date + 90),
  ((select id from public.products where slug = 'forastero'), 'CHO-FORA-2026-Q1', 900.000, 25.000, 2920.00, 'FOB', 'Kribi Deep Seaport', 'Global', '2025/2026', 'active', current_date + 90),
  ((select id from public.products where slug = 'trinitario'), 'CHO-TRIN-2026-Q1', 320.000, 18.000, 3380.00, 'FOB', 'Douala Port', 'EU / North America', '2025/2026', 'active', current_date + 90),
  ((select id from public.products where slug = 'criollo'), 'CHO-CRIO-2026-Q1', 120.000, 10.000, 3890.00, 'FOB', 'Douala Port', 'Specialty', '2025/2026', 'active', current_date + 90),
  ((select id from public.products where slug = 'cocoa-butter'), 'CHO-BUTR-2026-Q1', 220.000, 12.000, 4520.00, 'CIF', 'Kribi Deep Seaport', 'Global', '2025/2026', 'active', current_date + 90),
  ((select id from public.products where slug = 'cocoa-powder'), 'CHO-POWD-2026-Q1', 260.000, 12.000, 2980.00, 'CIF', 'Kribi Deep Seaport', 'Global', '2025/2026', 'active', current_date + 90)
on conflict (listing_code) do update
set
  available_quantity_mt = excluded.available_quantity_mt,
  minimum_order_mt = excluded.minimum_order_mt,
  price_usd_per_mt = excluded.price_usd_per_mt,
  incoterm = excluded.incoterm,
  origin_port = excluded.origin_port,
  destination_region = excluded.destination_region,
  harvest_season = excluded.harvest_season,
  status = excluded.status,
  valid_until = excluded.valid_until,
  updated_at = now();

-- Blog setup inferred from blog page
insert into public.blog_categories (slug, name, description)
values ('insights', 'Insights', 'Cocoa market and export operations insights')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.blog_posts (
  category_id,
  slug,
  title,
  excerpt,
  author_name,
  status,
  published_at
)
values
  ((select id from public.blog_categories where slug = 'insights'), 'cameroon-mid-crop-update', 'Cameroon Mid-Crop Update: Bean Quality and Volume Outlook', 'Current crop observations and export readiness indicators for buyers.', 'Export Desk', 'published', now()),
  ((select id from public.blog_categories where slug = 'insights'), 'sustainability-traceability-programs', 'Sustainability in Cameroon Cocoa: Traceability and Farmer Programs', 'How traceability programs strengthen quality and responsible sourcing.', 'Export Desk', 'published', now()),
  ((select id from public.blog_categories where slug = 'insights'), 'douala-kribi-shipment-windows', 'Export Logistics Insight: Douala and Kribi Shipment Windows', 'Planning guidance for vessel schedules and export lead times.', 'Export Desk', 'published', now()),
  ((select id from public.blog_categories where slug = 'insights'), 'quality-control-framework', 'Quality Control Framework: Moisture, Cut Test, and Grading Standards', 'Operational quality framework used before export dispatch.', 'Export Desk', 'published', now()),
  ((select id from public.blog_categories where slug = 'insights'), 'cooperative-capacity-building', 'Partnership Spotlight: Cooperative Capacity Building in Cameroon', 'How cooperative partnerships improve consistency and traceability.', 'Export Desk', 'published', now()),
  ((select id from public.blog_categories where slug = 'insights'), 'market-brief-price-movement', 'International Cocoa Market Brief: Price Movement and Buyer Strategy', 'Market briefing for procurement teams and trading desks.', 'Export Desk', 'published', now())
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  excerpt = excluded.excerpt,
  author_name = excluded.author_name,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

-- Testimonials aligned with product detail content
insert into public.buyer_testimonials (
  product_id,
  author_name,
  author_title,
  author_country,
  message,
  rating,
  up_votes,
  down_votes,
  status,
  display_order
)
values
  ((select id from public.products where slug = 'trinitario'), 'Procurement Lead', 'EU Chocolate Group', 'Belgium', 'Documentation quality is excellent and shipment schedules are consistently respected.', 5, 8, 0, 'published', 1),
  ((select id from public.products where slug = 'forastero'), 'Supply Director', 'Industrial Buyer', 'Canada', 'Reliable lot traceability and consistent quality for large manufacturing volumes.', 5, 7, 0, 'published', 2),
  ((select id from public.products where slug = 'criollo'), 'R and D Director', 'Specialty Chocolate Maker', 'France', 'Criollo lots meet our premium sensory expectations and arrive with complete documentation.', 5, 9, 0, 'published', 3),
  ((select id from public.products where slug = 'amelonado'), 'Sourcing Manager', 'Global Confectionery', 'Netherlands', 'Strong origin program with verified farmer partnerships and responsive support.', 5, 6, 0, 'published', 4)
on conflict do nothing;

commit;
