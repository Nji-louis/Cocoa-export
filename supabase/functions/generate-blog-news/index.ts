import { handleCors } from "../_shared/cors.ts";
import { getOptionalUser, requireStaffOrAdmin } from "../_shared/auth.ts";
import { getEnv } from "../_shared/env.ts";
import { fail, json } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { serveHttp } from "../_shared/runtime.ts";
import { assertAllowedOrigin, readJsonObject } from "../_shared/security.ts";

type Industry = "cocoa" | "coffee";

type NewsItem = {
  title: string;
  url: string;
  source: string;
  summary: string;
  publishedAt?: string;
  country?: string;
  industry: Industry;
};

type GeneratedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  featured_image_prompt: string;
  category: string;
  seo_title: string;
  seo_description: string;
  keywords: string[];
  internal_linking_suggestions: string[];
  source_country: string;
  industry_type: Industry;
};

type RelatedArticleSuggestion = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string | null;
};

type FaqItem = {
  question: string;
  answer: string;
};

type PublishingAssets = {
  suggested_tags: string[];
  social_facebook_post: string;
  social_linkedin_post: string;
  social_x_post: string;
  social_instagram_caption: string;
  related_articles: RelatedArticleSuggestion[];
  faq_items: FaqItem[];
  cta_text: string;
  reading_time_minutes: number;
  confidence_score: number;
  quality_check: Record<string, unknown>;
  content_language: string;
  publishing_assets: Record<string, unknown>;
};

const CATEGORIES = new Set([
  "Cocoa Beans",
  "Cocoa Powder",
  "Cocoa Liquor",
  "Arabica Coffee",
  "Robusta Coffee",
  "Market News",
  "Export Guides",
  "Industry Insights",
]);

const KEYWORDS = [
  "Cameroon cocoa exporter",
  "Cocoa powder supplier",
  "Cocoa beans supplier",
  "Cocoa exporter Africa",
  "Arabica coffee exporter",
  "Robusta coffee supplier",
  "Coffee exporter Cameroon",
  "Bulk cocoa supplier",
  "Bulk coffee supplier",
];

const IMAGE_FALLBACKS: Record<Industry, string> = {
  cocoa: "img/blog1.png",
  coffee: "img/arabic1.jpeg",
};

const OPENAI_DEFAULT_MODEL = "gpt-5.5";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";

const CONTENT_PROFILE_CONFIG: Record<Industry, {
  label: string;
  productTerms: string[];
  internalLinks: string[];
  cta: string;
  relatedSearchTerms: string[];
}> = {
  cocoa: {
    label: "Cocoa",
    productTerms: ["cocoa beans", "cocoa powder", "cocoa liquor", "cocoa butter"],
    internalLinks: [
      "/product_forastero.html",
      "/product_criollo.html",
      "/product_trinitario.html",
      "/services.html",
      "/contact.html",
      "/quote.html",
    ],
    cta: "Looking for a trusted cocoa supplier from Cameroon? Contact CocoaBridge for premium export-quality cocoa beans, cocoa powder, and cocoa liquor.",
    relatedSearchTerms: ["cocoa", "beans", "powder", "liquor", "export"],
  },
  coffee: {
    label: "Coffee",
    productTerms: ["arabica coffee", "robusta coffee", "green coffee", "coffee beans"],
    internalLinks: [
      "/landing-arabica-coffee-supplier.html",
      "/landing-robusta-coffee-supplier.html",
      "/product.html",
      "/services.html",
      "/contact.html",
      "/quote.html",
    ],
    cta: "Looking for a trusted coffee supplier from Cameroon? Contact CocoaBridge for premium export-quality Arabica coffee, Robusta coffee, and green coffee lots.",
    relatedSearchTerms: ["coffee", "arabica", "robusta", "green coffee", "export"],
  },
};

const SOURCES: Array<{ industry: Industry; country?: string; source: string; url: string }> = [
  { industry: "cocoa", country: "Cameroon", source: "Cameroon cocoa industry", url: "https://news.google.com/rss/search?q=Cameroon%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Ghana", source: "Ghana cocoa industry", url: "https://news.google.com/rss/search?q=Ghana%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Nigeria", source: "Nigeria cocoa industry", url: "https://news.google.com/rss/search?q=Nigeria%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Ivory Coast", source: "Ivory Coast cocoa industry", url: "https://news.google.com/rss/search?q=Ivory%20Coast%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Uganda", source: "Uganda cocoa industry", url: "https://news.google.com/rss/search?q=Uganda%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Togo", source: "Togo cocoa industry", url: "https://news.google.com/rss/search?q=Togo%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Liberia", source: "Liberia cocoa industry", url: "https://news.google.com/rss/search?q=Liberia%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", country: "Sierra Leone", source: "Sierra Leone cocoa industry", url: "https://news.google.com/rss/search?q=Sierra%20Leone%20cocoa%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", source: "ICCO", url: "https://news.google.com/rss/search?q=ICCO%20cocoa%20market&hl=en&gl=US&ceid=US:en" },
  { industry: "cocoa", source: "World Cocoa Foundation", url: "https://news.google.com/rss/search?q=World%20Cocoa%20Foundation%20cocoa&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Cameroon", source: "Cameroon coffee industry", url: "https://news.google.com/rss/search?q=Cameroon%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Ethiopia", source: "Ethiopia coffee industry", url: "https://news.google.com/rss/search?q=Ethiopia%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Uganda", source: "Uganda coffee industry", url: "https://news.google.com/rss/search?q=Uganda%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Kenya", source: "Kenya coffee industry", url: "https://news.google.com/rss/search?q=Kenya%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Tanzania", source: "Tanzania coffee industry", url: "https://news.google.com/rss/search?q=Tanzania%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Rwanda", source: "Rwanda coffee industry", url: "https://news.google.com/rss/search?q=Rwanda%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", country: "Burundi", source: "Burundi coffee industry", url: "https://news.google.com/rss/search?q=Burundi%20coffee%20industry%20export&hl=en&gl=US&ceid=US:en" },
  { industry: "coffee", source: "International Coffee Organization", url: "https://news.google.com/rss/search?q=International%20Coffee%20Organization%20coffee%20market&hl=en&gl=US&ceid=US:en" },
];

function normalizeSlug(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function stripHtml(value: string): string {
  return String(value || "")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value: string): string {
  return stripHtml(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTag(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function extractItems(xml: string, source: typeof SOURCES[number]): NewsItem[] {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].slice(0, 8);
  return itemMatches
    .map((match) => {
      const item = match[0];
      const title = extractTag(item, "title");
      const url = extractTag(item, "link");
      const summary = extractTag(item, "description");
      const publishedAt = extractTag(item, "pubDate");
      return {
        title,
        url,
        summary,
        publishedAt,
        source: source.source,
        country: source.country,
        industry: source.industry,
      };
    })
    .filter((item) => item.title && item.url);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CocoaBridge AI Blog News Bot/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry<T>(task: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function fetchNews(industry: Industry): Promise<NewsItem[]> {
  const selected = SOURCES.filter((source) => source.industry === industry);
  const batches = await Promise.all(selected.map(async (source) => {
    try {
      const response = await withRetry(() => fetchWithTimeout(source.url, 10000), 1);
      if (!response.ok) return [];
      const xml = await response.text();
      return extractItems(xml, source);
    } catch (_error) {
      return [];
    }
  }));
  return batches.flat().slice(0, 24);
}

function resolveRelativeUrl(value: string, baseUrl: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  try {
    return new URL(normalized, baseUrl).href;
  } catch (_error) {
    return normalized;
  }
}

function extractMetaContent(html: string, names: string[]): string {
  const metaTags = String(html || "").match(/<meta\b[^>]*>/gi) || [];
  const normalizedNames = names.map((name) => String(name || "").toLowerCase());
  for (const tag of metaTags) {
    const nameMatch = tag.match(/(?:property|name)=["']([^"']+)["']/i);
    const contentMatch = tag.match(/\bcontent=["']([^"']+)["']/i);
    if (!nameMatch || !contentMatch) continue;
    const tagName = String(nameMatch[1] || "").toLowerCase();
    if (!normalizedNames.some((needle) => tagName === needle || tagName.endsWith(`:${needle}`) || tagName.includes(needle))) {
      continue;
    }
    return contentMatch[1].trim();
  }
  return "";
}

function extractLinkImage(html: string): string {
  const linkTags = String(html || "").match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
    if (!relMatch || !hrefMatch) continue;
    if (String(relMatch[1] || "").toLowerCase().includes("image_src")) {
      return hrefMatch[1].trim();
    }
  }
  return "";
}

async function resolveSourceArticle(sourceUrl: string): Promise<{ resolvedUrl: string; imageUrl: string; sourceTitle: string }> {
  const fallback = String(sourceUrl || "").trim();
  if (!fallback) {
    return { resolvedUrl: "", imageUrl: "", sourceTitle: "" };
  }

  try {
    const response = await fetchWithTimeout(fallback, 12000);
    const resolvedUrl = response.url || fallback;
    const html = await response.text().catch(() => "");
    const imageCandidate = extractMetaContent(html, ["og:image", "twitter:image", "twitter:image:src", "og:image:secure_url"]) || extractLinkImage(html);
    const sourceTitle = extractMetaContent(html, ["og:title", "twitter:title"]) || "";
    return {
      resolvedUrl,
      imageUrl: resolveRelativeUrl(imageCandidate, resolvedUrl),
      sourceTitle,
    };
  } catch (_error) {
    return { resolvedUrl: fallback, imageUrl: "", sourceTitle: "" };
  }
}

function tokenSet(value: string): Set<string> {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
}

function jaccard(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function normalizeArticle(article: GeneratedArticle, industry: Industry): GeneratedArticle {
  const category = CATEGORIES.has(article.category) ? article.category : "Industry Insights";
  const slug = normalizeSlug(article.slug || article.title);
  const keywords = Array.from(new Set([
    ...((article.keywords || []).map((item) => String(item).trim()).filter(Boolean)),
    ...KEYWORDS.filter((keyword) => keyword.toLowerCase().includes(industry)),
  ])).slice(0, 14);

  return {
    ...article,
    industry_type: industry,
    category,
    slug,
    keywords,
    featured_image: article.featured_image || IMAGE_FALLBACKS[industry],
    content: String(article.content || "").trim(),
    excerpt: String(article.excerpt || "").trim().slice(0, 420),
    seo_title: String(article.seo_title || article.title || "").trim().slice(0, 70),
    seo_description: String(article.seo_description || article.excerpt || "").trim().slice(0, 170),
    source_country: String(article.source_country || "").trim(),
    internal_linking_suggestions: Array.isArray(article.internal_linking_suggestions)
      ? article.internal_linking_suggestions.slice(0, 8)
      : [],
  };
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function pickFocusCountry(items: NewsItem[]): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    const country = String(item.country || "").trim();
    if (!country) continue;
    counts.set(country, (counts.get(country) || 0) + 1);
  }

  let best = "";
  let bestCount = 0;
  for (const [country, count] of counts.entries()) {
    if (count > bestCount) {
      best = country;
      bestCount = count;
    }
  }

  return best || String(items[0]?.country || "").trim() || "regional";
}

function extractThemes(items: NewsItem[]): string[] {
  const sourceText = items.map((item) => `${item.title} ${item.summary}`).join(" ").toLowerCase();
  const themeMap: Array<[string, string]> = [
    ["quality", "quality control"],
    ["traceability", "traceability"],
    ["logistics", "logistics"],
    ["shipping", "shipping"],
    ["harvest", "harvest"],
    ["weather", "weather"],
    ["supply", "supply"],
    ["demand", "demand"],
    ["price", "pricing"],
    ["market", "market conditions"],
    ["certification", "certification"],
    ["sustainability", "sustainability"],
    ["farmer", "farmer readiness"],
    ["processing", "processing"],
    ["export", "export readiness"],
  ];

  return uniqueValues(
    themeMap.filter(([needle]) => sourceText.includes(needle)).map(([, label]) => label),
  ).slice(0, 6);
}

function summarizeSignals(items: NewsItem[]): string {
  return items
    .slice(0, 4)
    .map((item) => item.title.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("; ");
}

function buildKeywords(industry: Industry, themes: string[], country: string): string[] {
  const coreKeywords = industry === "cocoa"
    ? [
      "cocoa exporter",
      "cocoa beans supplier",
      "bulk cocoa supplier",
      "Cameroon cocoa exporter",
      "cocoa market news",
    ]
    : [
      "coffee exporter",
      "bulk coffee supplier",
      "Arabica coffee exporter",
      "Robusta coffee supplier",
      "coffee market news",
    ];

  return uniqueValues([
    ...coreKeywords,
    ...themes.map((theme) => `${theme} ${industry}`.trim()),
    country ? `${country} ${industry}`.trim() : "",
  ]).slice(0, 10);
}

function buildInternalLinks(industry: Industry, themes: string[]): string[] {
  const profile = CONTENT_PROFILE_CONFIG[industry];
  const links = profile.internalLinks;

  const themeLinks = themes.includes("traceability") ? ["/traceability.html"] : [];
  return uniqueValues([...links, ...themeLinks]).slice(0, 8);
}

function countWords(value: string): number {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function formatReadingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(Math.max(0, wordCount) / 180));
}

function buildSuggestedTags(industry: Industry, country: string, themes: string[], signalSummary: string): string[] {
  const profile = CONTENT_PROFILE_CONFIG[industry];
  return uniqueValues([
    `${country} ${profile.label}`,
    `${profile.label} Export`,
    `${profile.label} News`,
    ...profile.productTerms.map((term) => `${term} export`),
    ...themes.map((theme) => `${theme} ${profile.label}`),
    ...signalSummary.split(/[;,.]/).slice(0, 3).map((part) => part.trim()).filter(Boolean),
    "Food ingredients",
    "International trade",
  ]).slice(0, 15);
}

function buildSocialCopy(title: string, excerpt: string, cta: string, tags: string[]): PublishingAssets {
  const base = `${title} - ${excerpt}`.replace(/\s+/g, " ").trim();
  const xPost = `${title}. ${excerpt} ${tags.slice(0, 3).map((tag) => `#${tag.replace(/[^a-z0-9]+/gi, "")}`).join(" ")}`.trim().slice(0, 280);
  const linkedinPost = `${title}\n\n${excerpt}\n\n${cta}\n\n${tags.slice(0, 5).join(" | ")}`.trim();
  const facebookPost = `${base}\n\n${cta}`;
  const instagramCaption = `${title}\n\n${excerpt}\n\n${cta}\n\n${tags.slice(0, 8).map((tag) => `#${tag.replace(/[^a-z0-9]+/gi, "")}`).join(" ")}`.trim();
  return {
    suggested_tags: tags,
    social_facebook_post: facebookPost.slice(0, 1500),
    social_linkedin_post: linkedinPost.slice(0, 3000),
    social_x_post: xPost,
    social_instagram_caption: instagramCaption.slice(0, 2200),
    related_articles: [],
    faq_items: [],
    cta_text: cta,
    reading_time_minutes: formatReadingTimeMinutes(countWords(base)),
    confidence_score: 0,
    quality_check: {},
    content_language: "en",
    publishing_assets: {},
  };
}

function buildFaqItems(industry: Industry, country: string, themes: string[], cta: string): FaqItem[] {
  const label = CONTENT_PROFILE_CONFIG[industry].label.toLowerCase();
  const themeHint = themes[0] || "export planning";
  return [
    {
      question: `What does this ${label} update mean for buyers?`,
      answer: `It highlights the latest sourcing and export signals buyers should review before confirming orders, especially around ${themeHint} in ${country}.`,
    },
    {
      question: `How should importers use this information?`,
      answer: "Use it as a market briefing, then confirm quality, volumes, shipment timing, and documentation directly with the supplier.",
    },
    {
      question: `Does this replace supplier due diligence?`,
      answer: "No. It supports due diligence by showing current context, but contract checks and product verification still come first.",
    },
    {
      question: `What products does CocoaBridge offer?`,
      answer: cta,
    },
    {
      question: `Can this be adapted for other export products later?`,
      answer: "Yes. The content profile is configuration-driven so new products can be added without changing the database structure.",
    },
  ];
}

function buildArticleSections(
  industry: Industry,
  country: string,
  themes: string[],
  items: NewsItem[],
  signalSummary: string,
  cta: string,
  faqItems: FaqItem[],
  sourceUrl?: string,
  sourceTitle?: string,
): string {
  const profile = CONTENT_PROFILE_CONFIG[industry];
  const topItems = items.slice(0, 4);
  return [
    "<h2>What the latest signals suggest</h2>",
    `<p><strong>Current signal summary:</strong> ${signalSummary || `The latest ${profile.label.toLowerCase()} market signals point to active buyer attention around supply, quality, and export planning.`}</p>`,
    `<p>This update is built for buyers comparing origin options, export timing, and supplier readiness in ${country}. The recent headlines do not replace contract due diligence, but they do highlight where sourcing teams should pay attention right now.</p>`,
    "<h3>Why this matters now</h3>",
    "<p>Even small changes in weather, logistics, certification, and quality control can alter the real landed cost of a shipment. For procurement teams, the practical task is to filter the signal from the noise and turn headlines into a short checklist for supplier follow-up.</p>",
    "<h3>Key takeaways</h3>",
    "<ul>",
    ...[
      themes.includes("quality control")
        ? "Quality control is still the first checkpoint for any serious buyer."
        : `Compare supplier specifications carefully across ${country} and nearby origins.`,
      themes.includes("traceability")
        ? "Traceability expectations continue to shape shortlist decisions."
        : "Keep documentation, origin proof, and shipment history in the review process.",
      themes.includes("logistics") || themes.includes("shipping")
        ? "Logistics timing can change the real landed cost more than the headline price."
        : "Confirm lead times and loading windows before moving to order confirmation.",
    ].map((item) => `<li>${item}</li>`),
    "</ul>",
    "<h3>Practical sourcing notes</h3>",
    "<ul>",
    ...[
      `Use the latest signals as a short-listing tool, then confirm warehouse conditions, packing standards, and export documentation with the supplier.`,
      `Ask for recent lot photos, available volumes, and shipment history before moving from inquiry to purchase order.`,
      `When several origins look similar on paper, compare consistency, response speed, and after-sales support as carefully as price.`,
    ].map((item) => `<li>${item}</li>`),
    "</ul>",
    "<h3>Recent headlines in context</h3>",
    `<p>The main items we tracked this run were: ${topItems.map((item) => item.title).filter(Boolean).join(", ") || `general ${profile.label.toLowerCase()} market developments`}.</p>`,
    "<p>These stories are most useful when they are read alongside specification sheets, shipment history, and current stock availability. That combination gives buyers a more reliable picture than headline analysis alone.</p>",
    "<p><strong>Buyer takeaway:</strong> use this update as a working briefing, then confirm quality, export readiness, and documentation with your supplier before committing volume.</p>",
    "<h3>Frequently asked questions</h3>",
    ...faqItems.map((faq) => [
      `<h4>${faq.question}</h4>`,
      `<p>${faq.answer}</p>`,
    ].join("\n")),
    sourceUrl
      ? [
        "<h3>Source note</h3>",
        `<p>This article is based on current news coverage from <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceTitle || "the original source"}</a>.</p>`,
      ].join("\n")
      : "",
    "<h3>Ready to talk?</h3>",
    `<p>${cta}</p>`,
  ].join("\n");
}

function buildQualityCheck(params: {
  article: GeneratedArticle;
  assets: PublishingAssets;
  relatedCount: number;
  duplicateSimilarity: number;
  sourceCount: number;
}): PublishingAssets["quality_check"] {
  const { article, assets, relatedCount, duplicateSimilarity, sourceCount } = params;
  const contentWords = countWords(article.content);
  const sectionCount = (article.content.match(/<h[23h4]\b/gi) || []).length;
  const seoScore = Math.min(100, 60 + (article.seo_title ? 10 : 0) + (article.seo_description ? 10 : 0) + Math.min(10, assets.suggested_tags.length) + Math.min(10, relatedCount * 3));
  const readabilityScore = Math.min(100, 72 + Math.min(16, Math.max(0, 12 - Math.ceil(contentWords / 160))) + Math.min(10, sectionCount * 2));
  const originalityScore = Math.max(0, 100 - Math.round(duplicateSimilarity * 100));
  const completenessScore = Math.min(100, 55 + Math.min(10, assets.suggested_tags.length) + Math.min(10, assets.faq_items.length * 2) + Math.min(10, relatedCount * 2) + (assets.cta_text ? 5 : 0) + (assets.social_x_post ? 5 : 0) + (assets.social_linkedin_post ? 5 : 0));
  const confidenceScore = Math.round((seoScore * 0.25) + (readabilityScore * 0.2) + (originalityScore * 0.25) + (completenessScore * 0.3));
  return {
    source_count: sourceCount,
    content_words: contentWords,
    section_count: sectionCount,
    seo_score: seoScore,
    readability_score: readabilityScore,
    originality_score: originalityScore,
    completeness_score: completenessScore,
    confidence_score: confidenceScore,
    passed: seoScore >= 90 && readabilityScore >= 85 && originalityScore >= 85 && duplicateSimilarity < 0.72,
  };
}

function buildSourceCoverageDigest(items: NewsItem[]): string {
  const grouped = new Map<string, NewsItem[]>();
  for (const item of items) {
    const key = `${String(item.country || "regional").trim()}::${item.source}`;
    const list = grouped.get(key) || [];
    list.push(item);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries()).map(([key, list]) => {
    const [country, source] = key.split("::");
    const headlines = list.slice(0, 2).map((item) => `- ${item.title}`).join("\n");
    return `${source} (${country || "regional"}):\n${headlines}`;
  }).join("\n\n");
}

function extractOpenAIText(response: Record<string, unknown>): string {
  const direct = response.output_text;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const output = Array.isArray(response.output) ? response.output : [];
  const chunks: string[] = [];
  for (const entry of output) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = String((part as Record<string, unknown>).text || "").trim();
      if (text) chunks.push(text);
    }
  }
  return chunks.join("").trim();
}

function stripJsonCodeFence(value: string): string {
  const text = String(value || "").trim();
  if (text.startsWith("```")) {
    return text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  return text;
}

function parseOpenAIJson(value: string): Record<string, unknown> | null {
  const cleaned = stripJsonCodeFence(value);
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (_error) {
    return null;
  }
}

function buildOpenAIPayload(industry: Industry, items: NewsItem[], sourceUrl: string, sourceTitle: string): string {
  const profile = CONTENT_PROFILE_CONFIG[industry];
  const monitoredLocations = SOURCES
    .filter((source) => source.industry === industry)
    .map((source) => `${source.source}${source.country ? ` (${source.country})` : ""}`)
    .join(", ");
  const sourceDigest = buildSourceCoverageDigest(items);

  return [
    `You are writing for a professional B2B export company. Create a completely original news article in English.`,
    `Topic family: ${profile.label}.`,
    `Audience: cocoa buyers, coffee buyers, importers, distributors, food manufacturers, chocolate manufacturers, and beverage manufacturers.`,
    `Length: 800-1500 words.`,
    `Style: professional export-industry editorial with clear headings and practical buyer guidance.`,
    `Use only the source brief below. Do not copy sentences verbatim. Do not invent facts.`,
    `The article must reflect the latest available news from all monitored locations for this industry.`,
    `Monitored locations/sources: ${monitoredLocations}.`,
    `Primary source page: ${sourceTitle} - ${sourceUrl}.`,
    `Source digest:\n${sourceDigest}`,
    `Return valid JSON only with these keys:`,
    `title, slug, excerpt, content, seo_title, seo_description, keywords, internal_linking_suggestions, featured_image_prompt, suggested_tags, social_facebook_post, social_linkedin_post, social_x_post, social_instagram_caption, faq_items, cta_text, content_language, confidence_score, source_coverage.`,
    `Rules for fields:`,
    `- content_language must be "en".`,
    `- confidence_score must be a number from 0 to 100.`,
    `- keywords should contain 10 to 15 SEO terms.`,
    `- suggested_tags should contain 10 to 15 tags.`,
    `- internal_linking_suggestions should point to existing site pages when relevant.`,
    `- faq_items should contain exactly 5 items with question and answer.`,
    `- source_coverage should summarize each monitored source/location with a short signal note.`,
    `- cta_text should be a professional call to action for CocoaBridge.`,
  ].join("\n");
}

function normalizeOpenAIKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueValues(value.map((item) => String(item || "").trim()).filter(Boolean)).slice(0, 15);
}

function normalizeFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      question: String(source.question || "").trim(),
      answer: String(source.answer || "").trim(),
    };
  }).filter((item) => item.question && item.answer).slice(0, 5);
}

function normalizeRelatedSuggestions(value: unknown): RelatedArticleSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: String(source.id || "").trim(),
      slug: String(source.slug || "").trim(),
      title: String(source.title || "").trim(),
      excerpt: String(source.excerpt || "").trim(),
      category: String(source.category || "Industry Insights").trim(),
      published_at: source.published_at ? String(source.published_at).trim() : null,
    };
  }).filter((item) => item.slug && item.title).slice(0, 3);
}

async function generateOpenAIArticle(
  industry: Industry,
  items: NewsItem[],
  sourceUrl: string,
  sourceTitle: string,
): Promise<{ article: GeneratedArticle; assets: Partial<PublishingAssets>; source_coverage: unknown }> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }
  const model = getEnv("OPENAI_MODEL") || OPENAI_DEFAULT_MODEL;
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: "You are a senior B2B export news editor." }] },
        { role: "user", content: [{ type: "input_text", text: buildOpenAIPayload(industry, items, sourceUrl, sourceTitle) }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "blog_article_bundle",
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "title",
              "excerpt",
              "content",
              "seo_title",
              "seo_description",
              "keywords",
              "internal_linking_suggestions",
              "featured_image_prompt",
              "suggested_tags",
              "social_facebook_post",
              "social_linkedin_post",
              "social_x_post",
              "social_instagram_caption",
              "faq_items",
              "cta_text",
              "content_language",
              "confidence_score",
              "source_coverage",
            ],
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              excerpt: { type: "string" },
              content: { type: "string" },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              internal_linking_suggestions: { type: "array", items: { type: "string" } },
              featured_image_prompt: { type: "string" },
              suggested_tags: { type: "array", items: { type: "string" } },
              social_facebook_post: { type: "string" },
              social_linkedin_post: { type: "string" },
              social_x_post: { type: "string" },
              social_instagram_caption: { type: "string" },
              faq_items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["question", "answer"],
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                },
              },
              cta_text: { type: "string" },
              content_language: { type: "string" },
              confidence_score: { type: "number" },
              source_coverage: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["source", "location", "signal"],
                  properties: {
                    source: { type: "string" },
                    location: { type: "string" },
                    signal: { type: "string" },
                  },
                },
              },
            },
          },
          strict: true,
        },
      },
      max_output_tokens: 5500,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI generation failed: ${response.status} ${body}`.trim());
  }

  const payload = await response.json();
  const parsed = parseOpenAIJson(extractOpenAIText(payload));
  if (!parsed) {
    throw new Error("OpenAI returned an invalid JSON payload");
  }

  const title = String(parsed.title || "").trim();
  const content = String(parsed.content || "").trim();
  const excerpt = String(parsed.excerpt || "").trim();
  const seoTitle = String(parsed.seo_title || "").trim();
  const seoDescription = String(parsed.seo_description || "").trim();
  const confidenceScore = Number(parsed.confidence_score || 0);
  if (!title || !content || !excerpt || !seoTitle || !seoDescription) {
    throw new Error("OpenAI article bundle was missing required fields");
  }

  const country = pickFocusCountry(items);
  const themes = extractThemes(items);
  const category = themes.includes("market conditions") ? "Market News" : themes.includes("export readiness") ? "Export Guides" : "Industry Insights";

  return {
    article: normalizeArticle({
      title,
      slug: String(parsed.slug || title),
      excerpt,
      content,
      featured_image: IMAGE_FALLBACKS[industry],
      featured_image_prompt: String(parsed.featured_image_prompt || "").trim(),
      category,
      seo_title: seoTitle,
      seo_description: seoDescription,
      keywords: normalizeOpenAIKeywords(parsed.keywords),
      internal_linking_suggestions: normalizeOpenAIKeywords(parsed.internal_linking_suggestions),
      source_country: country,
      industry_type: industry,
    }, industry),
    assets: {
      suggested_tags: normalizeOpenAIKeywords(parsed.suggested_tags),
      social_facebook_post: String((parsed as Record<string, unknown>).social_facebook_post || "").trim(),
      social_linkedin_post: String((parsed as Record<string, unknown>).social_linkedin_post || "").trim(),
      social_x_post: String((parsed as Record<string, unknown>).social_x_post || "").trim(),
      social_instagram_caption: String((parsed as Record<string, unknown>).social_instagram_caption || "").trim(),
      faq_items: normalizeFaqItems(parsed.faq_items),
      cta_text: String(parsed.cta_text || "").trim(),
      reading_time_minutes: Math.max(1, Math.round(Number((parsed as Record<string, unknown>).reading_time_minutes || 0)) || formatReadingTimeMinutes(countWords(content))),
      confidence_score: Number.isFinite(confidenceScore) ? confidenceScore : 0,
      content_language: String(parsed.content_language || "en").trim() || "en",
      publishing_assets: {
        source_coverage: parsed.source_coverage || [],
        featured_image_prompt: String((parsed as Record<string, unknown>).featured_image_prompt || "").trim(),
      },
      related_articles: [],
      quality_check: {},
    },
    source_coverage: parsed.source_coverage || [],
  };
}

function scoreRelatedPost(article: GeneratedArticle, post: { title?: string | null; excerpt?: string | null; category?: string | null }): number {
  return jaccard(
    `${article.title} ${article.excerpt} ${article.keywords.join(" ")}`,
    `${post.title || ""} ${post.excerpt || ""} ${post.category || ""}`,
  );
}

async function findRelatedArticles(
  admin: ReturnType<typeof createServiceClient>,
  article: GeneratedArticle,
  industry: Industry,
): Promise<RelatedArticleSuggestion[]> {
  const { data, error } = await admin
    .from("blog_posts")
    .select("id, slug, title, excerpt, category, industry_type, status, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  if (error || !data) {
    return [];
  }

  return data
    .filter((post) => {
      const postIndustry = String(post.industry_type || "").toLowerCase();
      return !postIndustry || postIndustry === industry;
    })
    .map((post) => ({
      id: String(post.id || ""),
      slug: String(post.slug || ""),
      title: String(post.title || ""),
      excerpt: String(post.excerpt || ""),
      category: String(post.category || "Industry Insights"),
      published_at: post.published_at || null,
      score: scoreRelatedPost(article, post),
    }))
    .filter((post) => post.slug && post.title)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ score, ...post }) => post);
}

function buildArticle(industry: Industry, items: NewsItem[], variant = 1): GeneratedArticle {
  const country = pickFocusCountry(items);
  const themes = extractThemes(items);
  const signalSummary = summarizeSignals(items);
  const profile = CONTENT_PROFILE_CONFIG[industry];
  const industryLabel = profile.label;
  const monthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());
  const title = `${country} ${industryLabel} export update: buyer signals for ${monthYear}`;
  const keywords = buildKeywords(industry, themes, country);
  const internalLinkingSuggestions = buildInternalLinks(industry, themes);
  const excerpt = `${industryLabel} buyers should watch ${country} sourcing signals, current market themes, and practical export risks highlighted by the latest industry updates.`;
  const featuredImagePrompt = `${industryLabel} export market scene for CocoaBridge: clean warehouse or shipping context, professional B2B style, realistic, bright natural light, buyers reviewing quality and logistics documents.`;
  const category = themes.includes("market conditions") ? "Market News" : themes.includes("export readiness") ? "Export Guides" : "Industry Insights";
  const cta = profile.cta;
  const suggestedTags = buildSuggestedTags(industry, country, themes, signalSummary);
  const faqItems = buildFaqItems(industry, country, themes, cta);
  const content = buildArticleSections(industry, country, themes, items, signalSummary, cta, faqItems);
  const adjustedContent = variant > 1
    ? [
      content,
      "<h3>Additional buyer checklist</h3>",
      "<ul>",
      "<li>Confirm lot photos, moisture readings, and packing details.</li>",
      "<li>Request current availability and shipment windows before fixing pricing.</li>",
      "<li>Cross-check the source report and supplier statement before publishing internally.</li>",
      "</ul>",
    ].join("\n")
    : content;

  return normalizeArticle({
    title,
    slug: normalizeSlug(title),
    excerpt: excerpt.slice(0, 420),
    content: adjustedContent,
    featured_image: IMAGE_FALLBACKS[industry],
    featured_image_prompt: featuredImagePrompt,
    category,
    seo_title: `${country} ${industryLabel} export update for buyers`.slice(0, 70),
    seo_description: `${industryLabel} market signals from ${country} and related export themes buyers should watch this month.`.slice(0, 170),
    keywords,
    internal_linking_suggestions: internalLinkingSuggestions,
    source_country: country,
    industry_type: industry,
  }, industry);
}

async function generateArticle(industry: Industry, items: NewsItem[]): Promise<{ article: GeneratedArticle; model: string }> {
  return {
    article: buildArticle(industry, items),
    model: "local-template-v1",
  };
}

async function buildPublishingAssets(
  article: GeneratedArticle,
  industry: Industry,
  items: NewsItem[],
  relatedArticles: RelatedArticleSuggestion[],
  sourceUrl: string,
  sourceTitle: string,
  duplicateSimilarity: number,
): Promise<PublishingAssets> {
  const profile = CONTENT_PROFILE_CONFIG[industry];
  const suggestedTags = buildSuggestedTags(industry, article.source_country || pickFocusCountry(items), extractThemes(items), summarizeSignals(items));
  const ctaText = profile.cta;
  const faqItems = buildFaqItems(industry, article.source_country || pickFocusCountry(items), extractThemes(items), ctaText);
  const social = buildSocialCopy(article.title, article.excerpt, ctaText, suggestedTags);
  const estimatedReadingTime = formatReadingTimeMinutes(countWords(article.content));
  const qualityCheck = buildQualityCheck({
    article,
    assets: social,
    relatedCount: relatedArticles.length,
    duplicateSimilarity,
    sourceCount: items.length,
  });
  const confidenceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(qualityCheck.confidence_score || 0)),
    ),
  );

  return {
    ...social,
    suggested_tags: suggestedTags,
    related_articles: relatedArticles,
    faq_items: faqItems,
    cta_text: ctaText,
    reading_time_minutes: estimatedReadingTime,
    confidence_score: confidenceScore,
    quality_check: {
      ...qualityCheck,
      source_url: sourceUrl,
      source_title: sourceTitle,
    },
    content_language: "en",
    publishing_assets: {
      featured_image_prompt: article.featured_image_prompt,
      source_url: sourceUrl,
      source_title: sourceTitle,
      related_articles: relatedArticles,
      social,
      suggested_tags: suggestedTags,
      faq_items: faqItems,
      cta_text: ctaText,
      reading_time_minutes: estimatedReadingTime,
      confidence_score: confidenceScore,
      language: "en",
    },
  };
}

async function ensureUniqueDraft(admin: ReturnType<typeof createServiceClient>, article: GeneratedArticle) {
  const { data, error } = await admin
    .from("blog_posts")
    .select("id, title, slug, content")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(`Duplicate check failed: ${error.message}`);
  }

  let maxSimilarity = 0;
  for (const existing of data || []) {
    if (String(existing.title || "").toLowerCase() === article.title.toLowerCase()) {
      return { duplicate: true, reason: "title", maxSimilarity: 1 };
    }
    if (String(existing.slug || "").toLowerCase() === article.slug.toLowerCase()) {
      return { duplicate: true, reason: "slug", maxSimilarity: 1 };
    }
    maxSimilarity = Math.max(maxSimilarity, jaccard(article.content, String(existing.content || "")));
  }

  return { duplicate: maxSimilarity >= 0.72, reason: "similarity", maxSimilarity };
}

async function getCategoryId(admin: ReturnType<typeof createServiceClient>, category: string): Promise<string | null> {
  const slug = normalizeSlug(category);
  const { data, error } = await admin
    .from("blog_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

async function logRun(
  admin: ReturnType<typeof createServiceClient>,
  values: { source?: string; articleTitle?: string; success: boolean; errorMessage?: string; metadata?: Record<string, unknown> },
) {
  await admin.from("ai_blog_logs").insert({
    source: values.source || null,
    article_title: values.articleTitle || null,
    success: values.success,
    error_message: values.errorMessage || null,
    metadata: values.metadata || {},
  });
}

async function createDraft(admin: ReturnType<typeof createServiceClient>, industry: Industry) {
  const news = await fetchNews(industry);
  if (news.length === 0) {
    throw new Error(`No ${industry} news items were available from configured RSS sources`);
  }
  const primarySource = news[0];
  const resolvedSource = await resolveSourceArticle(primarySource.url);
  const resolvedSourceUrl = resolvedSource.resolvedUrl || primarySource.url;
  const resolvedSourceImage = resolvedSource.imageUrl || IMAGE_FALLBACKS[industry];
  const resolvedSourceTitle = resolvedSource.sourceTitle || primarySource.source || primarySource.title;
  const buildSavePayload = async (article: GeneratedArticle, aiAssets?: Partial<PublishingAssets>, model = "local-template-v1") => {
    const duplicate = await ensureUniqueDraft(admin, article);
    if (duplicate.duplicate) {
      await logRun(admin, {
        source: industry,
        articleTitle: article.title,
        success: false,
        errorMessage: `Duplicate prevented by ${duplicate.reason}`,
        metadata: { similarity: duplicate.maxSimilarity },
      });
      return { skipped: true as const, reason: duplicate.reason, title: article.title };
    }

    const relatedArticles = await findRelatedArticles(admin, article, industry);
    const localAssets = await buildPublishingAssets(article, industry, news, relatedArticles, resolvedSourceUrl, resolvedSourceTitle, duplicate.maxSimilarity);
    const mergedAssets: PublishingAssets = {
      ...localAssets,
      ...(aiAssets || {}),
      suggested_tags: (aiAssets?.suggested_tags && aiAssets.suggested_tags.length ? aiAssets.suggested_tags : localAssets.suggested_tags) || [],
      social_facebook_post: aiAssets?.social_facebook_post || localAssets.social_facebook_post,
      social_linkedin_post: aiAssets?.social_linkedin_post || localAssets.social_linkedin_post,
      social_x_post: aiAssets?.social_x_post || localAssets.social_x_post,
      social_instagram_caption: aiAssets?.social_instagram_caption || localAssets.social_instagram_caption,
      faq_items: (aiAssets?.faq_items && aiAssets.faq_items.length ? aiAssets.faq_items : localAssets.faq_items) || [],
      cta_text: aiAssets?.cta_text || localAssets.cta_text,
      reading_time_minutes: Number(aiAssets?.reading_time_minutes || localAssets.reading_time_minutes || formatReadingTimeMinutes(countWords(article.content))),
      confidence_score: Number(aiAssets?.confidence_score || localAssets.confidence_score || 0),
      content_language: aiAssets?.content_language || localAssets.content_language,
      related_articles: relatedArticles,
      publishing_assets: {
        ...(localAssets.publishing_assets || {}),
        ...(aiAssets?.publishing_assets || {}),
        source_url: resolvedSourceUrl,
        source_title: resolvedSourceTitle,
        source_coverage: aiAssets?.publishing_assets && typeof aiAssets.publishing_assets === "object"
          ? (aiAssets.publishing_assets as Record<string, unknown>).source_coverage || []
          : [],
        related_articles: relatedArticles,
      },
    };
    mergedAssets.quality_check = buildQualityCheck({
      article,
      assets: mergedAssets,
      relatedCount: relatedArticles.length,
      duplicateSimilarity: duplicate.maxSimilarity,
      sourceCount: news.length,
    }) as PublishingAssets["quality_check"];

    if (Number(mergedAssets.confidence_score || 0) < 85) {
      throw new Error(`Generated article confidence below threshold: ${mergedAssets.confidence_score}`);
    }

    const categoryId = await getCategoryId(admin, article.category);
    const { data, error } = await admin
      .from("blog_posts")
      .insert({
        category_id: categoryId,
        category: article.category,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        featured_image: resolvedSourceImage || article.featured_image,
        cover_external_url: resolvedSourceImage || article.featured_image,
        author_name: "CocoaBridge AI Research Desk",
        status: "draft",
        published_at: null,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        keywords: article.keywords,
        source_country: article.source_country || primarySource.country || null,
        industry_type: industry,
        source_url: resolvedSourceUrl,
        source_title: resolvedSourceTitle,
        featured_image_prompt: article.featured_image_prompt,
        internal_linking_suggestions: article.internal_linking_suggestions,
        suggested_tags: mergedAssets.suggested_tags,
        related_articles: mergedAssets.related_articles,
        faq_items: mergedAssets.faq_items,
        cta_text: mergedAssets.cta_text,
        confidence_score: mergedAssets.confidence_score,
        content_language: mergedAssets.content_language,
        reading_time_minutes: mergedAssets.reading_time_minutes,
        social_facebook_post: mergedAssets.social_facebook_post,
        social_linkedin_post: mergedAssets.social_linkedin_post,
        social_x_post: mergedAssets.social_x_post,
        social_instagram_caption: mergedAssets.social_instagram_caption,
        quality_check: mergedAssets.quality_check,
        publishing_assets: mergedAssets.publishing_assets,
        ai_generated: true,
        ai_generation_model: model,
        ai_generation_sources: news.slice(0, 12),
        ai_similarity_score: duplicate.maxSimilarity,
      })
      .select("id, title, slug, category, created_at")
      .single();

    if (error) {
      throw new Error(`Failed to save draft: ${error.message}`);
    }

    await logRun(admin, {
      source: industry,
      articleTitle: article.title,
      success: true,
      metadata: {
        draftId: data.id,
        slug: data.slug,
        category: data.category,
        sourceCount: news.length,
        similarity: duplicate.maxSimilarity,
        confidenceScore: mergedAssets.confidence_score,
        language: mergedAssets.content_language,
        relatedCount: mergedAssets.related_articles.length,
      },
    });

    return { skipped: false as const, draft: data };
  };

  try {
    const openAiDraft = await generateOpenAIArticle(industry, news, resolvedSourceUrl, resolvedSourceTitle);
    const article = {
      ...openAiDraft.article,
      featured_image: resolvedSourceImage || openAiDraft.article.featured_image,
    };
    return await buildSavePayload(article, openAiDraft.assets, getEnv("OPENAI_MODEL") || OPENAI_DEFAULT_MODEL);
  } catch (_openAiError) {
    const localArticle = buildArticle(industry, news);
    return await buildSavePayload(localArticle, undefined, "local-template-v1");
  }
}

async function authorize(req: Request) {
  const cronSecret = getEnv("AI_BLOG_CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (cronSecret && providedSecret && providedSecret === cronSecret) {
    return;
  }

  const user = await getOptionalUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  await requireStaffOrAdmin(user.id);
}

serveHttp(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return fail("Method not allowed", 405);
  }

  try {
    assertAllowedOrigin(req);
    await authorize(req);
    const body = await readJsonObject(req, 8192).catch((): Record<string, unknown> => ({}));
    const rawIndustries = body.industries;
    const requestedIndustries = Array.isArray(rawIndustries)
      ? rawIndustries.filter((item): item is Industry => item === "cocoa" || item === "coffee")
      : [] as Industry[];
    const industries: Industry[] = requestedIndustries.length ? requestedIndustries : ["cocoa", "coffee"];
    const admin = createServiceClient();
    const results = [];

    for (const industry of industries) {
      try {
        results.push({ industry, ...(await createDraft(admin, industry)) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown generation error";
        await logRun(admin, {
          source: industry,
          success: false,
          errorMessage: message,
        });
        results.push({ industry, skipped: true, error: message });
      }
    }

    return json({ status: "completed", results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return fail(message, status);
  }
});
