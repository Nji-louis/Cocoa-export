#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NEW_PHONE = '+237699745546';

const ignoredDirs = ['.git', 'node_modules', 'img', 'fonts'];
const textExt = ['.html', '.htm', '.js', '.css', '.json', '.md', '.txt', '.xml', '.yml', '.yaml'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.includes(entry.name)) return;
      walk(full);
      return;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!textExt.includes(ext)) return;
    processFile(full);
  });
}

function replaceCaseVariants(text) {
  // Replace all-upper, all-lower, capitalized
  text = text.replace(/COCOABRIDGE/g, 'COCOABRIDGE');
  text = text.replace(/cocoabridge/g, 'cocoabridge');
  text = text.replace(/Cocoabridge/g, 'Cocoabridge');
  return text;
}

function replaceNumbers(text) {
  // Match sequences containing digits, spaces, parentheses, plus, dashes
  // We'll replace matches where the total digit count >= 3
  return text.replace(/[+\d][\d\-\s\(\)]{2,}\d/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 3) return NEW_PHONE;
    return match;
  });
}

function processFile(filePath) {
  try {
    let src = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const afterBrand = replaceCaseVariants(src);
    if (afterBrand !== src) {
      src = afterBrand;
      changed = true;
    }

    const afterNums = replaceNumbers(src);
    if (afterNums !== src) {
      src = afterNums;
      changed = true;
    }

    if (changed) {
      const bak = filePath + '.bak';
      if (!fs.existsSync(bak)) fs.copyFileSync(filePath, bak);
      fs.writeFileSync(filePath, src, 'utf8');
      console.log('Updated:', path.relative(ROOT, filePath));
    }
  } catch (err) {
    console.error('Skip:', filePath, err.message);
  }
}

console.log('Starting replacements from', ROOT);
walk(ROOT);
console.log('Done');
