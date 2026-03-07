#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://nji-louis.github.io/Cocoa-export/';
const DEFAULT_OG_IMAGE = `${BASE_URL}img/cacao.jpg`;

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extract(regex, text) {
  const m = text.match(regex);
  return m ? m[1].trim() : '';
}

function canonicalFor(fileName) {
  if (fileName === 'index.html') {
    return BASE_URL;
  }
  return `${BASE_URL}${fileName}`;
}

function isRedirectPage(content, fileName) {
  if (fileName === 'admin.console.html') return true;
  if (/product_(amelonado|bresilien|criollo|cundeamor|forastero|trinitario)\.html/i.test(fileName)) return true;
  return /http-equiv\s*=\s*"refresh"/i.test(content);
}

function updateFile(filePath) {
  const fileName = path.basename(filePath);
  let src = fs.readFileSync(filePath, 'utf8');

  const title = extract(/<title>([\s\S]*?)<\/title>/i, src);
  const description = extract(/<meta\s+name="description"\s+content="([\s\S]*?)"\s*>/i, src);
  if (!title || !description) {
    return false;
  }

  const canonical = canonicalFor(fileName);
  const noIndex = fileName === 'admin_console.html' || fileName === 'admin.console.html' || isRedirectPage(src, fileName);
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large';

  const seoBlock = [
    `    <meta name="robots" content="${robots}">`,
    `    <link rel="canonical" href="${canonical}">`,
    `    <meta property="og:type" content="website">`,
    `    <meta property="og:site_name" content="CHOCOCAM S.A.R.L">`,
    `    <meta property="og:locale" content="en_CM">`,
    `    <meta property="og:title" content="${escapeAttr(title)}">`,
    `    <meta property="og:description" content="${escapeAttr(description)}">`,
    `    <meta property="og:url" content="${canonical}">`,
    `    <meta property="og:image" content="${DEFAULT_OG_IMAGE}">`,
    `    <meta name="twitter:card" content="summary_large_image">`,
    `    <meta name="twitter:title" content="${escapeAttr(title)}">`,
    `    <meta name="twitter:description" content="${escapeAttr(description)}">`,
    `    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">`
  ].join('\n');

  src = src.replace(/\n\s*<meta\s+name="robots"[\s\S]*?(?=\n\s*<title>|\n\s*<link href="https:\/\/fonts\.googleapis\.com|\n\s*<meta\s+http-equiv="refresh"|\n\s*<script|\n\s*<\/head>)/i, '\n');
  src = src.replace(/\n\s*<link\s+rel="canonical"[\s\S]*?(?=\n\s*<title>|\n\s*<link href="https:\/\/fonts\.googleapis\.com|\n\s*<meta\s+http-equiv="refresh"|\n\s*<script|\n\s*<\/head>)/i, '\n');
  src = src.replace(/\n\s*<meta\s+property="og:[^\n]+\n?/gi, '\n');
  src = src.replace(/\n\s*<meta\s+name="twitter:[^\n]+\n?/gi, '\n');

  if (/<meta\s+name="keywords"/i.test(src)) {
    src = src.replace(/(<meta\s+name="keywords"\s+content="[\s\S]*?"\s*>)/i, `$1\n${seoBlock}`);
  } else if (/<meta\s+name="description"/i.test(src)) {
    src = src.replace(/(<meta\s+name="description"\s+content="[\s\S]*?"\s*>)/i, `$1\n${seoBlock}`);
  }

  src = src.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

function main() {
  const htmlFiles = fs.readdirSync(ROOT).filter((name) => name.endsWith('.html'));
  let updated = 0;
  for (const file of htmlFiles) {
    const changed = updateFile(path.join(ROOT, file));
    if (changed) {
      updated += 1;
      console.log(`SEO updated: ${file}`);
    }
  }
  console.log(`\nSEO pass completed for ${updated} pages.`);
}

main();
