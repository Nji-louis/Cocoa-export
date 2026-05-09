const fs = require('fs');
const path = require('path');

function loadEnvFile(envFile = '.env') {
  const envPath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (!m) return;

    const key = m[1].trim();
    let val = m[2].trim();
    if (val.endsWith(';')) val = val.slice(0, -1).trim();
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  });
}

module.exports = { loadEnvFile };
