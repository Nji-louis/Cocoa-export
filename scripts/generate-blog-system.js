const fs = require('fs');
const path = require('path');
const { posts, articleAuthor } = require('./blog-posts.js');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://nji-louis.github.io/Cocoa-export/';
const SITE_NAME = 'CHOCOCAM S.A.R.L';
const CONTACT_EMAIL = 'export@chococam-sarl.com';
const CONTACT_PHONE = '+237699745546';
const GITHUB_FOOTER_DATE = '2026';
const LASTMOD = '2026-03-30';
const sortedPosts = [...posts].sort((a, b) => new Date(b.published) - new Date(a.published));
const categories = [
  'Cocoa Export Guide',
  'Cocoa Pricing & Market',
  'Cameroon Cocoa Industry',
  'Buyer Education',
  'Certifications & Quality'
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(relativePath, content) {
  const fullPath = path.join(ROOT, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, 'utf8');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugUrl(slug) {
  return `${BASE_URL}blog/${slug}.html`;
}

function absoluteImage(imagePath) {
  return `${BASE_URL}${imagePath}`;
}

function formatLongDate(value) {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function sectionId(index, section) {
  return `section-${index + 1}-${String(section.heading || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function subsectionId(index, subIndex, subsection) {
  return `subsection-${index + 1}-${subIndex + 1}-${String(subsection.heading || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function totalWords(post) {
  const parts = [];
  (post.lead || []).forEach((item) => parts.push(stripHtml(item)));
  (post.keyTakeaways || []).forEach((item) => parts.push(stripHtml(item)));
  (post.sections || []).forEach((section) => {
    parts.push(stripHtml(section.heading));
    (section.paragraphs || []).forEach((item) => parts.push(stripHtml(item)));
    (section.subsections || []).forEach((subsection) => {
      parts.push(stripHtml(subsection.heading));
      (subsection.paragraphs || []).forEach((item) => parts.push(stripHtml(item)));
    });
  });
  (post.faq || []).forEach((item) => {
    parts.push(stripHtml(item.question));
    parts.push(stripHtml(item.answer));
  });
  parts.push(stripHtml(post.ctaTitle));
  parts.push(stripHtml(post.ctaText));
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}

function readingTime(post) {
  return Math.max(4, Math.round(totalWords(post) / 220));
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}img/cacao.jpg`,
    image: `${BASE_URL}img/cacao.jpg`,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Bonaberi Industrial Zone',
      addressLocality: 'Douala',
      addressRegion: 'Littoral Region',
      addressCountry: 'CM'
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61582469037982',
      'https://www.linkedin.com/in/chococam-sarl-702208254'
    ]
  };
}

function pageHead(prefix, options) {
  return `
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="keywords" content="${escapeHtml(options.keywords.join(', '))}">
    <meta name="description" content="${escapeHtml(options.description)}">
    <meta name="robots" content="${options.robots || 'index,follow,max-image-preview:large'}">
    <link rel="canonical" href="${options.canonical}">
    <link rel="icon" type="image/svg+xml" href="${BASE_URL}favicon.svg">
    <link rel="apple-touch-icon" href="${BASE_URL}img/cacao.jpg">
    <meta name="theme-color" content="#4E342E">
    <meta property="og:type" content="${options.ogType || 'website'}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:locale" content="en_CM">
    <meta property="og:title" content="${escapeHtml(options.title)}">
    <meta property="og:description" content="${escapeHtml(options.description)}">
    <meta property="og:url" content="${options.canonical}">
    <meta property="og:image" content="${options.ogImage}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(options.title)}">
    <meta name="twitter:description" content="${escapeHtml(options.description)}">
    <meta name="twitter:image" content="${options.ogImage}">
    <script type="application/ld+json">
${JSON.stringify(options.schema, null, 2)}
    </script>
    <title>${escapeHtml(options.title)}</title>
    <link href="https://fonts.googleapis.com/css?family=Righteous&display=swap" rel="stylesheet">
    <link href="${prefix}css/bootstrap.min.css" rel="stylesheet">
    <link href="${prefix}css/global.min.css" rel="stylesheet">
    <link href="${prefix}${options.pageCss}" rel="stylesheet">
    <link href="${prefix}css/whatsapp-suite.min.css" rel="stylesheet">
    <link href="${prefix}css/language-switcher.min.css" rel="stylesheet">
    <link href="${prefix}css/newsletter.min.css" rel="stylesheet">
    <link href="${prefix}css/dark-mode.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="${prefix}css/font-awesome.min.css">
    <script src="${prefix}js/jquery-2.1.1.min.js"></script>
    <script src="${prefix}js/bootstrap.min.js"></script>
  </head>`;
}

function topBar(prefix) {
  return `
<section id="top">
 <div class="container">
  <div class="row">
   <div class="top_i clearfix">
    <div class="col-sm-2">
     <div class="top_i1 clearfix">
      <select class="form-control language-switcher" aria-label="Select website language">
       <option value="en">English</option>
       <option value="fr">French</option>
       <option value="es">Spanish</option>
       <option value="pt">Portuguese</option>
       <option value="de">German</option>
       <option value="ar">Arabic</option>
       <option value="zh-CN">Chinese (Simplified)</option>
       <option value="ru">Russian</option>
       <option value="tr">Turkish</option>
       <option value="hi">Hindi</option>
       <option value="ja">Japanese</option>
       <option value="it">Italian</option>
      </select>
     </div>
    </div>
    <div class="col-sm-2"><div class="top_i1 clearfix"><p class="top_contact"><i class="fa fa-phone"></i> +237699745546</p></div></div>
    <div class="col-sm-2"><div class="top_i1 clearfix"><p class="top_contact top_contact-link"><a href="mailto:${CONTACT_EMAIL}"><i class="fa fa-envelope"></i> ${CONTACT_EMAIL}</a></p></div></div>
    <div class="col-sm-6"><div class="top_i2 clearfix"><div class="top_theme"><button type="button" class="theme-toggle-btn" aria-label="Toggle dark mode" aria-pressed="false"><i class="fa fa-moon-o"></i> <span class="theme-toggle-label">Dark Mode</span></button></div></div></div>
   </div>
  </div>
 </div>
</section>`;
}

function header(prefix, detailHref) {
  return `
<section id="header" class="clearfix">
 <nav class="navbar">
  <div class="container">
   <div class="navbar-header page-scroll">
    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
     <span class="sr-only">Toggle navigation</span>
     <span class="icon-bar"></span>
     <span class="icon-bar"></span>
     <span class="icon-bar"></span>
    </button>
    <a class="navbar-brand" href="${prefix}index.html"><i class="fa fa-copyright"></i> CHOCOCAM</a>
   </div>
   <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
    <ul class="nav navbar-nav navbar-right">
     <li><a class="tag_m" href="${prefix}index.html">Home</a></li>
     <li><a class="tag_m" href="${prefix}about.html">About Us</a></li>
     <li><a class="tag_m" href="${prefix}services.html">Services</a></li>
     <li><a class="tag_m" href="${prefix}export.html">Export</a></li>
     <li class="dropdown">
      <button type="button" class="dropdown-toggle tag_m nav-dropdown-trigger" data-toggle="dropdown">Product <span class="caret" aria-hidden="true"></span></button>
      <ul class="dropdown-menu drop_m">
       <li><a href="${prefix}product.html">Product</a></li>
       <li><a href="${prefix}product_trinitario.html">Trinitario Product Detail</a></li>
       <li><a href="${prefix}traceability.html">Traceability</a></li>
      </ul>
     </li>
     <li class="dropdown">
      <button type="button" class="dropdown-toggle tag_m active_tab nav-dropdown-trigger" data-toggle="dropdown">Blog <span class="caret" aria-hidden="true"></span></button>
      <ul class="dropdown-menu drop_m">
       <li><a href="${prefix}blog.html">Blog</a></li>
       <li><a href="${detailHref}">Blog Detail</a></li>
      </ul>
     </li>
     <li><a class="tag_m" href="${prefix}contact.html">Contact</a></li>
    </ul>
   </div>
  </div>
 </nav>
</section>`;
}

function footer(prefix) {
  return `
<section id="footer">
 <div class="container">
  <div class="row">
   <div class="footer_1 clearfix">
    <div class="col-sm-4"><div class="footer_1i clearfix"><p class="footer-card-title mgt">Export Contact</p><div class="clearfix footer_1ii"><div class="col-sm-1 space_all"><span><i class="fa fa-phone"></i></span></div><div class="col-sm-11 space_all"><p class="footer-meta mgt">+237699745546</p><p class="footer-meta mgt">+237 699 745 546</p></div></div></div></div>
    <div class="col-sm-4"><div class="footer_1i clearfix"><p class="footer-card-title mgt">Location</p><div class="clearfix footer_1ii"><div class="col-sm-1 space_all"><span><i class="fa fa-map-marker"></i></span></div><div class="col-sm-11 space_all"><p class="footer-meta mgt">Bonaberi Industrial Zone, Douala</p><p class="footer-meta mgt">Littoral Region, Cameroon</p></div></div></div></div>
    <div class="col-sm-4"><div class="footer_1i clearfix"><p class="footer-card-title mgt">Export Email</p><div class="clearfix footer_1ii"><div class="col-sm-1 space_all"><span><i class="fa fa-envelope"></i></span></div><div class="col-sm-11 space_all"><p class="footer-meta mgt">${CONTACT_EMAIL}</p><p class="footer-meta mgt">WhatsApp: +237 699 745 546</p></div></div></div></div>
   </div>
   <div class="footer_2 clearfix">
    <div class="col-sm-3"><div class="footer_2i clearfix"><a class="navbar-brand" href="${prefix}index.html"><i class="fa fa-copyright"></i> CHOCOCAM</a><p>Cameroon cocoa exporter delivering traceable beans, strict quality control, and dependable international logistics for industrial and specialty buyers.</p><ul class="social-network social-circle"><li><a href="https://www.facebook.com/profile.php?id=61582469037982" class="icoFacebook" title="Facebook"><i class="fa fa-facebook"></i></a></li><li><a href="https://www.linkedin.com/in/chococam-sarl-702208254" class="icoLinkedin" title="LinkedIn"><i class="fa fa-linkedin"></i></a></li></ul></div></div>
    <div class="col-sm-3"><div class="footer_2i1 clearfix"><p class="footer-list-title mgt">Quick Links</p><hr><ul><li><a href="${prefix}index.html"><i class="fa fa-arrow-right"></i> Home</a></li><li><a href="${prefix}about.html"><i class="fa fa-arrow-right"></i> About Us</a></li><li><a href="${prefix}services.html"><i class="fa fa-arrow-right"></i> Services</a></li><li><a href="${prefix}traceability.html"><i class="fa fa-arrow-right"></i> Traceability</a></li><li><a href="${prefix}blog.html"><i class="fa fa-arrow-right"></i> Blog</a></li><li><a href="${prefix}contact.html"><i class="fa fa-arrow-right"></i> Contact</a></li></ul></div></div>
    <div class="col-sm-3"><div class="footer_2i1 clearfix"><p class="footer-list-title mgt">Newsletter</p><hr><p>Get cocoa market updates, pricing movement, and shipment availability.</p><form class="mc-newsletter-form" action="https://gmail.us16.list-manage.com/subscribe/post?u=c443adc19861278f769d85aa0&amp;id=173fa77baa&amp;f_id=00ebc2e1f0" method="post" target="_blank" novalidate><div class="mc-field-group"><label for="mce-FNAME-footer">First Name</label><input type="text" name="FNAME" class="form-control" id="mce-FNAME-footer" placeholder="First Name"></div><div class="mc-field-group"><label for="mce-EMAIL-footer">Email Address <span class="asterisk">*</span></label><input type="email" name="EMAIL" class="form-control" id="mce-EMAIL-footer" required placeholder="Email Address"></div><div aria-hidden="true" class="mc-hidden-field"><input type="text" name="b_c443adc19861278f769d85aa0_173fa77baa" tabindex="-1" value=""></div><button type="submit" name="subscribe" class="mc-submit"><span>SUBSCRIBE</span> <i class="fa fa-chevron-right"></i></button></form><p class="mc-newsletter-note">Powered by Mailchimp</p></div></div>
    <div class="col-sm-3"><div class="footer_2i1 clearfix"><p class="footer-list-title mgt">Gallery</p><hr><div class="footer_2i1i clearfix"><div class="col-sm-4 space_left"><img loading="lazy" src="${prefix}img/blog1.png" alt="Cocoa article thumbnail" class="iw"></div><div class="col-sm-4 space_left"><img loading="lazy" src="${prefix}img/blog2.png" alt="Cocoa article thumbnail" class="iw"></div><div class="col-sm-4 space_left"><img loading="lazy" src="${prefix}img/blog3.png" alt="Cocoa article thumbnail" class="iw"></div></div><div class="footer_2i1i clearfix"><div class="col-sm-4 space_left"><img loading="lazy" src="${prefix}img/blog4.png" alt="Cocoa article thumbnail" class="iw"></div><div class="col-sm-4 space_left"><img loading="lazy" src="${prefix}img/blog5.png" alt="Cocoa article thumbnail" class="iw"></div><div class="col-sm-4 space_left"><img loading="lazy" src="${prefix}img/blog6.png" alt="Cocoa article thumbnail" class="iw"></div></div></div></div>
   </div>
  </div>
 </div>
</section>
<section id="footer_bottom"><div class="container"><div class="row"><div class="col-sm-12"><div class="footer_bottom_1 text-center"><p class="mgt">© ${GITHUB_FOOTER_DATE} ${SITE_NAME}. All Rights Reserved | <a href="${prefix}terms_and_conditions.html">Terms &amp; Conditions</a> | <a href="${prefix}privacy_policy.html">Privacy Policy</a></p></div></div></div></div></section>`;
}

function sharedScripts(prefix) {
  return `
<div id="toTop" class="btn btn-info" style="display:block;background:#000;color:#fff;border:none;"><span class="fa fa-chevron-up"></span></div>
<script>
$(document).ready(function(){
  $('body').append('<div id="toTop" class="btn btn-info"><span class="glyphicon glyphicon-chevron-up"></span> Back to Top</div>');
  $(window).scroll(function(){
    if ($(this).scrollTop() !== 0) {
      $('#toTop').fadeIn();
    } else {
      $('#toTop').fadeOut();
    }
  });
  $('#toTop').click(function(){
    $('html, body').animate({ scrollTop: 0 }, 600);
    return false;
  });
});
</script>
<script src="${prefix}js/site-search.min.js"></script>
<script src="${prefix}js/theme-toggle.min.js"></script>
<script src="${prefix}js/instagram-posts.min.js"></script>
<script src="${prefix}js/ui-enhancements.min.js"></script>
<script src="${prefix}js/seo-schema.min.js"></script>
<div id="google_translate_element" class="google-translate-holder"></div>
<script src="${prefix}js/language-switcher.min.js"></script>
<script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
<div class="wa-suite"><div class="wa-welcome-bubble" id="waWelcomeBubble">Need help with cocoa export?</div><div class="wa-suite-btn" id="waSuiteBtn"><img loading="lazy" src="https://cdn-icons-png.flaticon.com/512/124/124034.png" alt="WhatsApp"></div><div class="wa-suite-window" id="waSuiteWindow"><div class="wa-suite-header"><h4>CHOCOCAM S.A.R.L Ltd</h4><p>Your Cocoa Export Partner</p></div><div class="wa-agents"><div class="wa-agent" data-number="237699745546" data-role="Sales" data-msg="Hello Sales Team! I want information about cocoa exportation."><img loading="lazy" src="${prefix}img/fem.png" alt="Sales Team"><div><h5>Sales Team</h5><p>Online | Cocoa Export Info</p></div></div><div class="wa-agent" data-number="237699745546" data-role="Pricing" data-msg="Hello! Please send me your cocoa price per ton."><img loading="lazy" src="${prefix}img/fem.png" alt="Pricing Desk"><div><h5>Pricing Desk</h5><p>Online | Get a Fast Quote</p></div></div><div class="wa-agent" data-number="237699745546" data-role="Shipping" data-msg="Hello! I need your cocoa shipping terms and export procedures."><img loading="lazy" src="${prefix}img/fem.png" alt="Shipping Office"><div><h5>Shipping Office</h5><p>Online | Logistics & Export</p></div></div><div class="wa-agent" data-number="237699745546" data-role="Support" data-msg="Hello! I need customer support."><img loading="lazy" src="${prefix}img/fem.png" alt="Customer Support"><div><h5>Customer Support</h5><p>Online | Assistance</p></div></div></div><div class="wa-darkmode-toggle" id="waDarkToggle">Dark Mode</div></div></div>
<script src="${prefix}js/whatsapp-suite.min.js"></script>
<script type="text/javascript">var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();(function(){var s1=document.createElement('script'),s0=document.getElementsByTagName('script')[0];s1.async=true;s1.src='https://embed.tawk.to/692d8747a6c0d5197e352108/1jbctgst8';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();</script>`;
}

function relatedPosts(post) {
  const sameCategory = sortedPosts.filter((item) => item.slug !== post.slug && item.category === post.category);
  const fallback = sortedPosts.filter((item) => item.slug !== post.slug && !sameCategory.includes(item));
  return sameCategory.concat(fallback).slice(0, 3);
}

function hubCard(post, index) {
  return `
      <article class="blog-hub-card" data-category="${escapeHtml(post.category)}" data-keywords="${escapeHtml([post.keyword].concat(post.keywords).join(' '))}" data-title="${escapeHtml(post.title)}" data-excerpt="${escapeHtml(post.excerpt)}" ${index >= 6 ? 'data-hidden-initial="true"' : ''}>
        <a class="blog-hub-card-image" href="blog/${post.slug}.html"><img loading="lazy" src="${post.image}" alt="${escapeHtml(post.imageAlt)}"></a>
        <div class="blog-hub-card-body">
          <div class="blog-card-meta"><span class="blog-card-category">${escapeHtml(post.category)}</span><span class="blog-card-date">${escapeHtml(formatLongDate(post.published))}</span></div>
          <p class="blog-card-keyword">${escapeHtml(post.keyword)}</p>
          <h2><a href="blog/${post.slug}.html">${escapeHtml(post.title)}</a></h2>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="blog-card-footer"><span class="blog-card-reading">${readingTime(post)} min read</span><a class="button_1 blog-card-button" href="blog/${post.slug}.html"><span>READ MORE</span> <i class="fa fa-chevron-right"></i></a></div>
        </div>
      </article>`;
}

function articleBody(post) {
  const intro = (post.lead || []).map((paragraph) => `<p>${paragraph}</p>`).join('\n');
  const takeaways = `<section class="blog-article-block blog-key-takeaways"><h2 id="key-takeaways">Key Buyer Takeaways</h2><ul>${post.keyTakeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
  const sections = (post.sections || []).map((section, index) => {
    const lines = [`<section class="blog-article-block">`, `<h2 id="${sectionId(index, section)}">${escapeHtml(section.heading)}</h2>`];
    (section.paragraphs || []).forEach((paragraph) => lines.push(`<p>${paragraph}</p>`));
    (section.subsections || []).forEach((subsection, subIndex) => {
      lines.push(`<h3 id="${subsectionId(index, subIndex, subsection)}">${escapeHtml(subsection.heading)}</h3>`);
      (subsection.paragraphs || []).forEach((paragraph) => lines.push(`<p>${paragraph}</p>`));
    });
    lines.push('</section>');
    return lines.join('\n');
  }).join('\n');
  const cta = `<section class="blog-article-cta"><h2>${escapeHtml(post.ctaTitle)}</h2><p>${escapeHtml(post.ctaText)}</p><div class="hero-cta-group"><a class="button" href="../contact.html"><span>REQUEST A QUOTE</span> <i class="fa fa-chevron-right"></i></a><a class="button_1" href="../services.html"><span>VIEW SERVICES</span> <i class="fa fa-chevron-right"></i></a></div></section>`;
  const faq = `<section class="blog-article-block blog-faq-block"><h2 id="buyer-faq">Frequently Asked Questions</h2>${post.faq.map((item) => `<div class="blog-faq-item"><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></div>`).join('')}</section>`;
  return `${intro}\n${takeaways}\n${sections}\n${cta}\n${faq}`;
}

function relatedMarkup(post) {
  return relatedPosts(post).map((item) => `
        <article class="related-post-card">
          <a class="related-post-image" href="${item.slug}.html"><img loading="lazy" src="../${item.image}" alt="${escapeHtml(item.imageAlt)}"></a>
          <div class="related-post-body">
            <p class="related-post-tag">${escapeHtml(item.category)}</p>
            <h3><a href="${item.slug}.html">${escapeHtml(item.title)}</a></h3>
            <p>${escapeHtml(item.excerpt)}</p>
            <a class="related-post-link" href="${item.slug}.html">Read article <i class="fa fa-arrow-right"></i></a>
          </div>
        </article>`).join('\n');
}

function renderHub() {
  const featured = sortedPosts[0];
  const schema = [
    organizationSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Cocoa Export Blog | CHOCOCAM S.A.R.L',
      description: 'SEO resources, buyer education, Cameroon cocoa market insights, and export guides for international cocoa buyers.',
      url: `${BASE_URL}blog.html`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: sortedPosts.map((post, index) => ({ '@type': 'ListItem', position: index + 1, url: slugUrl(post.slug), name: post.title }))
    }
  ];

  return `<!DOCTYPE html>
<html lang="en">${pageHead('', {
    title: 'Cocoa Export Blog | CHOCOCAM S.A.R.L',
    description: 'SEO resources, buyer education, Cameroon cocoa market insights, and export guides for international cocoa buyers.',
    canonical: `${BASE_URL}blog.html`,
    ogImage: absoluteImage(featured.image),
    pageCss: 'css/blog.min.css?v=20260330-seo-hub',
    keywords: ['Cameroon cocoa blog', 'cocoa export guide', 'cocoa market news', 'buyer education', 'cocoa pricing Cameroon'],
    schema
  })}
<body>
${topBar('')}
${header('', `blog/${featured.slug}.html`)}
<section id="center" class="center_about center_about_blog">
 <div class="container"><div class="row"><div class="center_about_1 text-center clearfix"><p class="blog-hero-kicker">SEO Content Hub</p><h1 class="mgt">Cameroon Cocoa Export Blog for International Buyers</h1><p class="blog-hero-copy">Practical guides, market insights, and buyer education content designed to increase buyer trust and organic visibility.</p></div></div></div>
</section>
<main id="about_page" class="blog-hub-main">
 <section class="blog-hub-intro"><div class="container"><div class="row"><div class="col-sm-12"><div class="blog-hub-featured"><div class="blog-hub-featured-copy"><p class="blog-section-label">Featured article</p><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.excerpt)}</p><div class="blog-featured-points"><span><i class="fa fa-book"></i>${sortedPosts.length} SEO articles</span><span><i class="fa fa-tags"></i>${categories.length} core categories</span><span><i class="fa fa-check-circle"></i>Buyer-focused content</span></div><div class="hero-cta-group"><a class="button" href="blog/${featured.slug}.html"><span>READ FEATURED GUIDE</span> <i class="fa fa-chevron-right"></i></a><a class="button_1" href="contact.html"><span>REQUEST QUOTE</span> <i class="fa fa-chevron-right"></i></a></div></div><a class="blog-hub-featured-media" href="blog/${featured.slug}.html"><img src="${featured.image}" alt="${escapeHtml(featured.imageAlt)}" fetchpriority="high"></a></div></div></div></div></section>
 <section class="blog-hub-toolbar-section"><div class="container"><div class="row"><div class="col-sm-12"><div class="blog-hub-toolbar"><div class="blog-search-box"><label for="blog-search-input">Search articles</label><div class="input-group"><span class="input-group-addon"><i class="fa fa-search"></i></span><input id="blog-search-input" class="form-control" type="search" placeholder="Search by keyword, title, or topic"></div></div><div class="blog-filter-box"><label for="blog-category-filter">Filter by category</label><select id="blog-category-filter" class="form-control"><option value="">All Categories</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></div></div><div class="blog-chip-row" id="blog-chip-row"><button type="button" class="blog-chip is-active" data-category="">All</button>${categories.map((category) => `<button type="button" class="blog-chip" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}</div><div class="blog-hub-results-bar"><p id="blog-results-count">Showing ${sortedPosts.length} articles</p><a href="services.html">Explore export services</a></div></div></div></div></section>
 <section class="blog-hub-grid-section"><div class="container"><div class="row"><div class="col-sm-12"><div class="blog-hub-grid" id="blog-hub-grid">${sortedPosts.map(hubCard).join('')}</div><div class="blog-hub-empty" id="blog-hub-empty" hidden><h2>No articles match this search</h2><p>Try a broader keyword or switch to another category filter.</p></div><div class="blog-load-more-wrap"><button type="button" class="button_1 blog-load-more" id="blog-load-more"><span>LOAD MORE</span> <i class="fa fa-chevron-down"></i></button></div></div></div></div></section>
 <section class="blog-newsletter-strip"><div class="container"><div class="row"><div class="col-sm-8"><p class="blog-section-label">Lead generation</p><h2>Get cocoa market updates and buyer-ready export insights</h2><p>Subscribe for export guides, pricing context, and traceability-focused procurement content designed for international cocoa buyers.</p></div><div class="col-sm-4"><a class="button blog-newsletter-cta" href="contact.html"><span>SPEAK TO EXPORT DESK</span> <i class="fa fa-chevron-right"></i></a></div></div></div></section>
</main>
${footer('')}
${sharedScripts('')}
<script src="js/blog-hub.min.js?v=20260330-seo-hub"></script>
</body>
</html>`;
}

function renderArticle(post) {
  const schema = [
    organizationSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription,
      image: [absoluteImage(post.image)],
      author: { '@type': 'Person', name: articleAuthor },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${BASE_URL}img/cacao.jpg` } },
      datePublished: post.published,
      dateModified: LASTMOD,
      mainEntityOfPage: slugUrl(post.slug),
      articleSection: post.category,
      keywords: [post.keyword].concat(post.keywords)
    }
  ];

  return `<!DOCTYPE html>
<html lang="en">${pageHead('../', {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.metaDescription,
    canonical: slugUrl(post.slug),
    ogImage: absoluteImage(post.image),
    ogType: 'article',
    pageCss: 'css/blog_detail.min.css?v=20260330-seo-article',
    keywords: [post.keyword].concat(post.keywords),
    schema
  })}
<body>
${topBar('../')}
${header('../', `${post.slug}.html`)}
<section id="center" class="center_about center_about_blog_detail"><div class="container"><div class="row"><div class="center_about_1 text-center clearfix"><p class="blog-hero-kicker">${escapeHtml(post.category)}</p><h1 class="mgt">${escapeHtml(post.title)}</h1><p class="blog-hero-copy">${escapeHtml(post.excerpt)}</p></div></div></div></section>
<main id="about_page" class="blog-article-main">
 <section class="blog-article-shell"><div class="container"><div class="row"><div class="col-sm-8"><article class="blog-article-card"><nav class="blog-breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span>/</span><a href="../blog.html">Blog</a><span>/</span><span>${escapeHtml(post.title)}</span></nav><div class="blog-article-meta"><span><i class="fa fa-user"></i> ${escapeHtml(articleAuthor)}</span><span><i class="fa fa-calendar"></i> ${escapeHtml(formatLongDate(post.published))}</span><span><i class="fa fa-clock-o"></i> ${readingTime(post)} min read</span></div><div class="blog-article-cover"><img src="../${post.image}" alt="${escapeHtml(post.imageAlt)}" fetchpriority="high"></div><div class="blog-article-body" id="blog-article-body">${articleBody(post)}</div><section class="blog-related-section"><div class="about_h clearfix"><h2 class="mgt">Related Posts</h2><hr></div><div class="related-post-grid">${relatedMarkup(post)}</div></section></article></div><div class="col-sm-4"><aside class="blog-article-sidebar"><div class="blog-sidebar-card"><p class="blog-section-label">Table of contents</p><nav id="article-toc" class="article-toc" aria-label="Table of contents"></nav></div><div class="blog-sidebar-card"><p class="blog-section-label">Category</p><p class="blog-sidebar-category">${escapeHtml(post.category)}</p><p class="blog-sidebar-keyword">Primary keyword: ${escapeHtml(post.keyword)}</p></div><div class="blog-sidebar-card"><p class="blog-section-label">Internal links</p><ul class="blog-sidebar-links"><li><a href="../index.html">Homepage</a></li><li><a href="../services.html">Export services</a></li><li><a href="../traceability.html">Traceability page</a></li><li><a href="../contact.html">Contact page</a></li></ul></div><div class="blog-sidebar-card blog-sidebar-cta"><p class="blog-section-label">Buyer CTA</p><h2>Need a buyer-ready cocoa quote?</h2><p>Send your target volume, quality profile, destination port, and timeline for a structured export response.</p><a class="button" href="../contact.html"><span>CONTACT CHOCOCAM</span> <i class="fa fa-chevron-right"></i></a></div></aside></div></div></div></section>
</main>
${footer('../')}
${sharedScripts('../')}
<script src="../js/blog-article.min.js?v=20260330-seo-article"></script>
</body>
</html>`;
}

function redirectPage() {
  const featured = sortedPosts[0];
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0; url=blog/${featured.slug}.html">
    <meta name="description" content="Redirecting to the featured CHOCOCAM cocoa export article.">
    <meta name="robots" content="noindex,follow">
    <link rel="canonical" href="${slugUrl(featured.slug)}">
    <title>Redirecting to Featured Cocoa Export Article | ${SITE_NAME}</title>
  </head>
  <body>
    <p>Redirecting to the featured article: <a href="blog/${featured.slug}.html">${escapeHtml(featured.title)}</a></p>
  </body>
</html>`;
}

function sitemap() {
  const baseUrls = [
    { loc: BASE_URL, lastmod: LASTMOD, changefreq: 'weekly', priority: '1.0' },
    { loc: `${BASE_URL}about.html`, lastmod: '2026-03-06', changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}services.html`, lastmod: '2026-03-06', changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}export.html`, lastmod: '2026-03-06', changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}product.html`, lastmod: '2026-03-06', changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}product_detail.html`, lastmod: '2026-03-06', changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}traceability.html`, lastmod: '2026-03-06', changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}blog.html`, lastmod: LASTMOD, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}contact.html`, lastmod: '2026-03-06', changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}terms_and_conditions.html`, lastmod: '2026-03-06', changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE_URL}privacy_policy.html`, lastmod: '2026-03-06', changefreq: 'yearly', priority: '0.3' }
  ];
  const blogUrls = sortedPosts.map((post) => ({ loc: slugUrl(post.slug), lastmod: LASTMOD, changefreq: 'monthly', priority: '0.8' }));
  const allUrls = baseUrls.concat(blogUrls);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map((item) => `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;
}

function main() {
  writeFile('blog.html', renderHub());
  writeFile('blog_detail.html', redirectPage());
  sortedPosts.forEach((post) => writeFile(path.join('blog', `${post.slug}.html`), renderArticle(post)));
  writeFile('sitemap.xml', sitemap());
  console.log(`Generated ${sortedPosts.length} article pages.`);
  sortedPosts.forEach((post) => console.log(`${post.slug}: ${totalWords(post)} words`));
}

main();
