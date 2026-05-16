#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://nji-louis.github.io/Cocoa-export/';
const DEFAULT_OG_IMAGE = `${BASE_URL}img/cacao.jpg`;
const APPLE_TOUCH_ICON = `${BASE_URL}img/cacao.jpg`;
const FAVICON = `${BASE_URL}favicon.svg`;

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

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function canonicalFor(relativePath) {
  if (relativePath === 'index.html') {
    return BASE_URL;
  }
  return `${BASE_URL}${relativePath}`;
}

function relativeDir(relativePath) {
  const dir = path.posix.dirname(relativePath);
  return dir === '.' ? '' : `${dir}/`;
}

function extractRedirectTarget(content) {
  const metaRefresh = content.match(/<meta\s+http-equiv\s*=\s*"refresh"\s+content="\d+\s*;\s*url=([^"]+)"/i);
  if (metaRefresh && metaRefresh[1]) {
    return metaRefresh[1].trim();
  }

  const locationReplace = content.match(/window\.location\.replace\(\s*"([^"]+)"\s*\)/i);
  if (locationReplace && locationReplace[1]) {
    return locationReplace[1].trim();
  }

  return '';
}

function canonicalForRedirect(relativePath, content) {
  const target = extractRedirectTarget(content);
  if (!target) {
    return canonicalFor(relativePath);
  }

  try {
    return new URL(target, `${BASE_URL}${relativeDir(relativePath)}`).toString();
  } catch (error) {
    return canonicalFor(relativePath);
  }
}

function isPrivatePage(relativePath) {
  return (
    relativePath === 'auth/login.html' ||
    relativePath === 'admin/login.html' ||
    relativePath.startsWith('admin/') ||
    relativePath.startsWith('buyer-portal/')
  );
}

function trimTitleSuffix(title, suffixPattern, fallbackValue) {
  const trimmed = String(title || '').replace(suffixPattern, '').trim();
  return trimmed || fallbackValue;
}

function inferDescription(relativePath, title) {
  if (relativePath === 'auth/login.html') {
    return 'Secure account access page for CHOCOCAM buyers, staff, and administrators.';
  }

  if (relativePath === 'admin/login.html') {
    return 'Administrative access page for CHOCOCAM platform management.';
  }

  if (relativePath.startsWith('admin/')) {
    const section = trimTitleSuffix(title, /\s*\|\s*CHOCOCAM(?:\s+Admin)?\s*$/i, 'CHOCOCAM operations');
    return `Administrative interface for ${section}.`;
  }

  if (relativePath.startsWith('buyer-portal/')) {
    const section = trimTitleSuffix(title, /\s*\|\s*CHOCOCAM\s*$/i, 'CHOCOCAM accounts');
    return `Buyer portal page for ${section}.`;
  }

  return '';
}

function schemaFor({ title, description, canonical, noIndex }) {
  if (noIndex) return '';

  const payload = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CHOCOCAM S.A.R.L',
      url: BASE_URL,
      logo: DEFAULT_OG_IMAGE,
      image: DEFAULT_OG_IMAGE,
      email: 'export@chococam-sarl.com',
      telephone: '+237671742824',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bonaberi Industrial Zone',
        addressLocality: 'Douala',
        addressRegion: 'Littoral Region',
        addressCountry: 'CM',
      },
      sameAs: [
        'https://www.facebook.com/profile.php?id=61582469037982',
        'https://www.linkedin.com/in/chococam-sarl-702208254',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': canonical === BASE_URL ? 'WebSite' : 'WebPage',
      name: title,
      description,
      url: canonical,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        name: 'CHOCOCAM S.A.R.L',
        url: BASE_URL,
      },
    },
  ];

  return [
    '    <script type="application/ld+json" data-static-schema="true">',
    ...JSON.stringify(payload, null, 2).split('\n').map((line) => `    ${line}`),
    '    </script>',
  ].join('\n');
}

function isRedirectPage(content, relativePath) {
  if (/product_(amelonado|bresilien|criollo|cundeamor|forastero|trinitario|cocoa_butter|cocoa_shell)\.html/i.test(relativePath)) return true;
  return /http-equiv\s*=\s*"refresh"/i.test(content);
}

function updateFile(filePath) {
  const relativePath = toPosix(path.relative(ROOT, filePath));
  let src = fs.readFileSync(filePath, 'utf8');

  const title = extract(/<title>([\s\S]*?)<\/title>/i, src);
  const existingDescription = extract(/<meta\s+name="description"\s+content="([\s\S]*?)"\s*>/i, src);
  const description = existingDescription || inferDescription(relativePath, title);
  if (!title || !description) {
    return false;
  }

  const redirectPage = isRedirectPage(src, relativePath);
  const canonical = redirectPage ? canonicalForRedirect(relativePath, src) : canonicalFor(relativePath);
  const noIndex = isPrivatePage(relativePath) || redirectPage;
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large';
  const schemaBlock = schemaFor({ title, description, canonical, noIndex });

  const seoLines = [
    `    <meta name="description" content="${escapeAttr(description)}">`,
    `    <meta name="robots" content="${robots}">`,
    `    <link rel="canonical" href="${canonical}">`,
    `    <link rel="icon" type="image/svg+xml" href="${FAVICON}">`,
    `    <link rel="apple-touch-icon" href="${APPLE_TOUCH_ICON}">`,
    '    <meta name="theme-color" content="#4E342E">',
    '    <meta property="og:type" content="website">',
    '    <meta property="og:site_name" content="CHOCOCAM S.A.R.L">',
    '    <meta property="og:locale" content="en_CM">',
    `    <meta property="og:title" content="${escapeAttr(title)}">`,
    `    <meta property="og:description" content="${escapeAttr(description)}">`,
    `    <meta property="og:url" content="${canonical}">`,
    `    <meta property="og:image" content="${DEFAULT_OG_IMAGE}">`,
    '    <meta name="twitter:card" content="summary_large_image">',
    `    <meta name="twitter:title" content="${escapeAttr(title)}">`,
    `    <meta name="twitter:description" content="${escapeAttr(description)}">`,
    `    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">`,
    schemaBlock,
  ].filter(Boolean);
  const seoBlock = seoLines.join('\n');
  src = src.replace(/\n\s*<meta\s+http-equiv="X-UA-Compatible"[^\n]*\n?/gi, "\n");


  src = src.replace(/\n\s*<meta\s+name="description"[^\n]*\n?/gi, '\n');
  src = src.replace(/\n\s*<meta\s+name="robots"[\s\S]*?(?=\n\s*<title>|\n\s*<link href="https:\/\/fonts\.googleapis\.com|\n\s*<meta\s+http-equiv="refresh"|\n\s*<script|\n\s*<\/head>)/i, '\n');
  src = src.replace(/\n\s*<link\s+rel="canonical"[\s\S]*?(?=\n\s*<title>|\n\s*<link href="https:\/\/fonts\.googleapis\.com|\n\s*<meta\s+http-equiv="refresh"|\n\s*<script|\n\s*<\/head>)/i, '\n');
  src = src.replace(/\n\s*<link\s+rel="icon"[^\n]*\n?/gi, '\n');
  src = src.replace(/\n\s*<link\s+rel="apple-touch-icon"[^\n]*\n?/gi, '\n');
  src = src.replace(/\n\s*<meta\s+name="theme-color"[^\n]*\n?/gi, '\n');
  src = src.replace(/\n\s*<meta\s+property="og:[^\n]+\n?/gi, '\n');
  src = src.replace(/\n\s*<meta\s+name="twitter:[^\n]+\n?/gi, '\n');
  src = src.replace(/\n\s*<script\s+type="application\/ld\+json"\s+data-static-schema="true">[\s\S]*?<\/script>\n?/gi, '\n');

  if (/<meta\s+name="keywords"/i.test(src)) {
    src = src.replace(/(<meta\s+name="keywords"\s+content="[\s\S]*?"\s*>)/i, `$1\n${seoBlock}`);
  } else if (/<meta\s+name="viewport"/i.test(src)) {
    src = src.replace(/(<meta\s+name="viewport"[\s\S]*?>)/i, `$1\n${seoBlock}`);
  } else if (/<meta\s+charset/i.test(src)) {
    src = src.replace(/(<meta\s+charset[\s\S]*?>)/i, `$1\n${seoBlock}`);
  }

  src = src.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

function walkHtmlFiles(startDir) {
  const files = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const htmlFiles = walkHtmlFiles(ROOT);
  let updated = 0;
  for (const file of htmlFiles) {
    const changed = updateFile(file);
    if (changed) {
      updated += 1;
      console.log(`SEO updated: ${toPosix(path.relative(ROOT, file))}`);
    }
  }
  console.log(`\nSEO pass completed for ${updated} pages.`);
}

main();
