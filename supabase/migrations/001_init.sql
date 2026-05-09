-- Initial schema for CAMCOCOA

-- Users table (accounts)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'buyer',
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  origin_country text,
  cocoa_type text,
  price numeric,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Cocoa batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text NOT NULL UNIQUE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  harvest_date date,
  weight_kg numeric,
  quality_grade text,
  created_at timestamptz DEFAULT now()
);

-- Buyers table
CREATE TABLE IF NOT EXISTS buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES buyers(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  shipped_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Simple RPC example: record_trace
-- Trace logs table
CREATE TABLE IF NOT EXISTS trace_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Simple RPC example: record_trace
CREATE OR REPLACE FUNCTION record_trace(batch uuid, note text)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO trace_logs (id, batch_id, note, created_at)
  VALUES (gen_random_uuid(), batch, note, now());
$$;
