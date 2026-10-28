#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://cocoabridge.com';
const PRIVATE_PATHS = new Set([
  'blog_detail.html',
  'google-site-verification-template.html',
  'product_detail.html',
  'search_results.html',
  'test-connection.html',
]);
const failures = [];

function walkHtml(directory, results = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkHtml(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getMetaContents(html, selectorName) {
  const escaped = selectorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(
    `<meta\\s+name=["']${escaped}["']\\s+content=["']([^"']*)["'][^>]*>`,
    'gi'
  ))].map((match) => match[1].trim());
}

function getCanonical(html) {
  return [...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1].trim());
}

function getMetaPropertyContents(html, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(
    `<meta\\s+property=["']${escaped}["']\\s+content=["']([^"']*)["'][^>]*>`,
    'gi'
  ))].map((match) => match[1].trim());
}

function isPrivate(relativePath, html) {
  const normalized = relativePath.split(path.sep).join('/').toLowerCase();
  return normalized.startsWith('admin/')
    || normalized.startsWith('mcp/')
    || PRIVATE_PATHS.has(normalized)
    || /<meta\s+http-equiv=["']refresh["']/i.test(html)
    || /window\.location\.replace\(/i.test(html)
    || getMetaContents(html, 'robots').some((value) => /noindex/i.test(value));
}

function fail(message) {
  failures.push(message);
}

function checkUnique(values, label) {
  const seen = new Map();
  for (const [file, value] of values) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      fail(`${label} is duplicated in ${file} and ${seen.get(normalized)}: ${value}`);
    } else {
      seen.set(normalized, file);
    }
  }
}

const htmlFiles = walkHtml(ROOT);
const publicPages = [];
const titles = [];
const descriptions = [];
const canonicalUrls = [];

for (const file of htmlFiles) {
  const relativePath = path.relative(ROOT, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  if (isPrivate(relativePath, html)) continue;

  publicPages.push({ file, relativePath, html });
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const descriptionTags = getMetaContents(html, 'description');
  const robotsTags = getMetaContents(html, 'robots');
  const canonicalTags = getCanonical(html);
  const h1Count = [...html.matchAll(/<h1(?:\s[^>]*)?>/gi)].length;

  if (!title) fail(`${relativePath} has no title.`);
  else titles.push([relativePath, title]);
  if (descriptionTags.length !== 1 || !descriptionTags[0]) {
    fail(`${relativePath} must have exactly one non-empty meta description.`);
  } else {
    descriptions.push([relativePath, descriptionTags[0]]);
  }
  if (robotsTags.length !== 1) fail(`${relativePath} must have exactly one robots meta tag.`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (getMetaPropertyContents(html, property).length !== 1) {
      fail(`${relativePath} must have exactly one ${property} tag.`);
    }
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (getMetaContents(html, name).length !== 1) {
      fail(`${relativePath} must have exactly one ${name} tag.`);
    }
  }
  if (canonicalTags.length !== 1) {
    fail(`${relativePath} must have exactly one canonical URL.`);
  } else {
    try {
      const canonical = new URL(canonicalTags[0]);
      if (canonical.protocol !== 'https:' || canonical.hostname !== 'cocoabridge.com') {
        fail(`${relativePath} canonical is not on the preferred HTTPS host: ${canonicalTags[0]}`);
      }
      canonicalUrls.push([relativePath, canonicalTags[0]]);
    } catch {
      fail(`${relativePath} has an invalid canonical URL: ${canonicalTags[0]}`);
    }
  }
  if (h1Count !== 1) fail(`${relativePath} has ${h1Count} H1 elements; expected exactly one.`);
  if (!/<html[^>]+\blang=["']en["']/i.test(html)) fail(`${relativePath} has no English html lang attribute.`);
  if (!/<meta\s+charset=["']utf-8["']/i.test(html)) fail(`${relativePath} has no UTF-8 charset declaration.`);
  if (!/<meta\s+name=["']viewport["']/i.test(html)) fail(`${relativePath} has no viewport declaration.`);
  if (/noindex/i.test(getMetaContents(html, 'robots').join(' '))) {
    fail(`${relativePath} is public but has a noindex directive.`);
  }
  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=/i.test(image[1])) fail(`${relativePath} has an image without an alt attribute.`);
  }

  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(block[1].trim());
    } catch {
      fail(`${relativePath} has invalid JSON-LD.`);
    }
  }
}

for (const { relativePath, html } of publicPages) {
  const pageUrl = new URL(`${BASE_URL}/${relativePath}`);
  for (const linkMatch of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const rawHref = linkMatch[2].trim();
    if (!rawHref || rawHref.includes('${') || rawHref.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(rawHref)) continue;
    let targetUrl;
    try {
      targetUrl = new URL(rawHref, pageUrl);
    } catch {
      fail(`${relativePath} has an invalid internal link: ${rawHref}`);
      continue;
    }
    if (!['cocoabridge.com', 'www.cocoabridge.com'].includes(targetUrl.hostname)) continue;
    const pathname = targetUrl.pathname.endsWith('/')
      ? `${targetUrl.pathname}index.html`
      : targetUrl.pathname || '/index.html';
    const target = path.join(ROOT, decodeURIComponent(pathname.replace(/^\/+/, '')));
    if (!target.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(target)) {
      fail(`${relativePath} links to a missing local page: ${rawHref}`);
    } else if (targetUrl.hostname === 'www.cocoabridge.com') {
      fail(`${relativePath} links to the non-preferred www host: ${rawHref}`);
    }
  }
}

checkUnique(titles, 'Title');
checkUnique(descriptions, 'Meta description');
checkUnique(canonicalUrls, 'Canonical URL');

const sitemapPath = path.join(ROOT, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)]
  .map((match) => match[1].trim());
const blogHtml = fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8');
const staticBlogPaths = [...blogHtml.matchAll(/href=["'](blog\/[^"']+\.html)["']/gi)]
  .map((match) => match[1]);
const productHtml = fs.readFileSync(path.join(ROOT, 'product.html'), 'utf8');
const productLinks = [...productHtml.matchAll(/href=["']product_detail\.html\?slug=([^"'&]+)["']/gi)];
if (!/^<\?xml\b/i.test(sitemap.trim())) fail('sitemap.xml has no XML declaration.');
if ((sitemap.match(/<url>/gi) || []).length !== sitemapLocations.length) {
  fail('sitemap.xml has malformed URL entries.');
}
if (new Set(sitemapLocations).size !== sitemapLocations.length) {
  fail('sitemap.xml contains duplicate URLs.');
}
for (const [page, canonical] of canonicalUrls) {
  if (!sitemapLocations.includes(canonical)) {
    fail(`Indexable page is missing from the sitemap: ${page} (${canonical})`);
  }
}

for (const location of sitemapLocations) {
  try {
    const url = new URL(location);
    if (url.protocol !== 'https:' || url.hostname !== 'cocoabridge.com') {
      fail(`Sitemap URL is not on the preferred HTTPS host: ${location}`);
      continue;
    }
    if (url.search) {
      fail(`Sitemap URL is a client-rendered query route and is not statically verifiable: ${location}`);
      continue;
    }
    const pathname = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
    const target = path.join(ROOT, decodeURIComponent(pathname.replace(/^\/+/, '')));
    if (!target.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(target)) {
      fail(`Sitemap URL does not map to a local file: ${location}`);
      continue;
    }
    const targetHtml = fs.readFileSync(target, 'utf8');
    const canonical = getCanonical(targetHtml);
    if (canonical.length !== 1 || canonical[0] !== location) {
      fail(`Sitemap URL is not the page's unique canonical URL: ${location}`);
    }
    if (isPrivate(path.relative(ROOT, target), targetHtml)) {
      fail(`Sitemap includes a noindex or redirect URL: ${location}`);
    }
  } catch {
    fail(`Sitemap contains an invalid URL: ${location}`);
  }
}

for (const articlePath of new Set(staticBlogPaths)) {
  const location = `${BASE_URL}/${articlePath}`;
  if (!sitemapLocations.includes(location)) {
    fail(`Static blog article is not present in the sitemap: ${location}`);
  }
}

for (const relativePath of [
  'blog_detail.html',
  'google-site-verification-template.html',
  'product_detail.html',
  'search_results.html',
  'test-connection.html',
]) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (!getMetaContents(html, 'robots').some((value) => /noindex/i.test(value))) {
    fail(`${relativePath} should be noindex.`);
  }
}

const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
if (!/^User-agent:\s*\*/mi.test(robots)) fail('robots.txt has no wildcard user-agent section.');
if (!/^Allow:\s*\/\s*$/mi.test(robots)) fail('robots.txt does not explicitly allow crawling.');
if (!/^Sitemap:\s*https:\/\/cocoabridge\.com\/sitemap\.xml\s*$/mi.test(robots)) {
  fail('robots.txt does not reference the canonical sitemap URL.');
}
if (/^Disallow:\s*\/test-connection\.html\s*$/mi.test(robots)) {
  fail('robots.txt blocks the test utility page from being crawled to discover its noindex directive.');
}

const staticProductLinks = productLinks.filter((match) => !match[0].includes('${'));
if (/<p[^>]*>\s*Loading Products(?:\.{3})?\s*<\/p>/i.test(productHtml)) {
  fail('Product catalog has a loading-only fallback.');
}
if (staticProductLinks.length < 9) fail(`Product catalog has only ${staticProductLinks.length} static product links; expected at least nine.`);

const staticBlogLinks = new Set(staticBlogPaths);
if (staticBlogLinks.size < 19) fail(`Blog listing has only ${staticBlogLinks.size} crawlable static article links; expected at least 19.`);

console.log(`Checked ${publicPages.length} indexable HTML pages.`);
console.log(`Checked ${sitemapLocations.length} sitemap URLs.`);
console.log(`Checked ${staticProductLinks.length} static product detail links and ${staticBlogLinks.size} static blog links.`);
if (failures.length) {
  console.error(`\nSEO validation failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log('SEO validation passed.');
}
