const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { loadEnvFile } = require('./load_env');

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env or environment.');
  process.exit(1);
}

let options = { auth: { persistSession: false } };
try { const ws = require('ws'); options.realtime = { transport: ws }; } catch (e) {}

const supabase = createClient(url, serviceKey, options);

async function run() {
  // Map product slug -> local image files to upload and register
  const mapping = [
    { slug: 'amelonado', files: ['ame.jpg'] },
    { slug: 'bresilien', files: ['ab.jpg'] },
    { slug: 'cundeamor', files: ['Cun.png'] },
    { slug: 'forastero', files: ['For5.jpg'] },
    { slug: 'criollo', files: ['Cri1.png'] },
    { slug: 'trinitario', files: ['Tri3.png'] },
    { slug: 'cocoa-butter', files: ['cocoabut.png'] },
    { slug: 'cocoa-powder', files: ['coshe.png'] }
  ];

  const toUpsert = [];

  for (const entry of mapping) {
    const { data: prod, error: qerr } = await supabase
      .from('products')
      .select('id')
      .eq('slug', entry.slug)
      .single();
    if (qerr) {
      console.error(`Query error for slug ${entry.slug}:`, qerr.message || qerr);
      continue;
    }
    if (!prod || !prod.id) {
      console.log(`Product not found, skipping slug: ${entry.slug}`);
      continue;
    }

    for (let i = 0; i < entry.files.length; i++) {
      const filename = entry.files[i];
      const localPath = path.join(process.cwd(), 'img', filename);
      if (!fs.existsSync(localPath)) {
        console.log(`Local file not found, skipping: ${localPath}`);
        continue;
      }

      const storagePath = `products/${entry.slug}/${filename}`;
      const fileBuf = fs.readFileSync(localPath);
      const uploadRes = await supabase.storage.from('product-media').upload(storagePath, fileBuf, { upsert: true });
      if (uploadRes.error) {
        console.error(`Upload failed for ${storagePath}:`, uploadRes.error.message || uploadRes.error);
        continue;
      }

      toUpsert.push({ product_id: prod.id, bucket_name: 'product-media', storage_path: storagePath, is_primary: i === 0 });
    }
  }

  if (toUpsert.length === 0) {
    console.log('No rows to insert.');
    return;
  }

  const { error: insErr } = await supabase
    .from('product_media_assets')
    .upsert(toUpsert, { onConflict: 'bucket_name,storage_path' });
  if (insErr) {
    console.error('Insert failed:', insErr.message || insErr);
    process.exit(2);
  }
  console.log(`Inserted/updated ${toUpsert.length} product media rows.`);
}

run();
