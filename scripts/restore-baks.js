#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      walk(full);
      continue;
    }
    if (full.endsWith('.bak')) {
      const orig = full.slice(0, -4);
      try {
        fs.renameSync(full, orig);
        console.log('Restored', path.relative(ROOT, orig));
      } catch (err) {
        console.error('Failed to restore', full, err.message);
      }
    }
  }
}

walk(ROOT);
console.log('Restore complete');
