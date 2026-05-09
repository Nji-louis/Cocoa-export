const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { loadEnvFile } = require('./load_env');

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

// Provide a WebSocket transport for Node.js < 22
let createOptions = { auth: { persistSession: false } };
try {
  const ws = require('ws');
  createOptions.realtime = { transport: ws };
} catch (e) {
  // ws not available; proceed without realtime transport (only REST operations used)
}

const supabase = createClient(url, serviceKey, createOptions);

async function run() {
  const bucketId = 'product-media';
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) throw listErr;
    if (Array.isArray(buckets) && buckets.find(b => b.name === bucketId)) {
      console.log(`Bucket '${bucketId}' already exists.`);
      return;
    }

    const { data: created, error } = await supabase.storage.createBucket(bucketId, { public: true });
    if (error) throw error;
    console.log(`Bucket '${bucketId}' created (public).`);
  } catch (err) {
    console.error('Failed to create bucket:', err.message || err);
    process.exit(2);
  }
}

run();
