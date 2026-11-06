// Reads a page's HTML and checks the things business owners care about:
// can customers reach you, do you look trustworthy, does Google understand you.
// Returns a 0–100 "Contact & trust" score plus plain-English results.

const clean = (s, max = 160) =>
  String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const first = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : '';
};

const metaContent = (html, name) =>
  first(html, new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
  first(html, new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));

export function analyzeHtml(html, finalUrl) {
  const h = html || '';

  const facts = {
    https: finalUrl.startsWith('https://'),
    title: clean(first(h, /<title[^>]*>([\s\S]*?)<\/title>/i), 120),
    description: clean(metaContent(h, 'description'), 200),
    h1: clean(first(h, /<h1[^>]*>([\s\S]*?)<\/h1>/i), 150),
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(h),
    hasOgImage: Boolean(metaContent(h, 'og:image')),
    hasFavicon: /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(h),
    hasPhone: /href=["']tel:/i.test(h),
    hasEmail: /href=["']mailto:/i.test(h),
    hasWhatsApp: /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|chat\.whatsapp\.com/i.test(h),
    hasForm: /<form[\s\S]{0,4000}?(?:type=["']email["']|name=["'][^"']*e-?mail[^"']*["'])/i.test(h),
    hasContactPage: /href=["'][^"']*contact[^"']*["']/i.test(h),
    socials: ['instagram.com', 'facebook.com', 'x.com/', 'twitter.com', 'linkedin.com', 'tiktok.com', 'youtube.com'].filter((d) =>
      h.toLowerCase().includes(d)
    ).length,
  };

  const directContact = facts.hasPhone || facts.hasEmail || facts.hasWhatsApp || facts.hasForm;

  const items = [
    { key: 'https', label: 'Secure connection (https)', pass: facts.https, weight: 20 },
    { key: 'contact', label: 'A tap-to-call, email, WhatsApp or contact form on the page', pass: directContact, weight: 30 },
    { key: 'contactPage', label: 'A link to a contact page', pass: facts.hasContactPage, weight: 10 },
    { key: 'socials', label: 'Links to your social profiles', pass: facts.socials > 0, weight: 10 },
    { key: 'title', label: 'A page title for Google and browser tabs', pass: Boolean(facts.title), weight: 10 },
    { key: 'description', label: 'A description for Google search results', pass: Boolean(facts.description), weight: 10 },
    { key: 'favicon', label: 'A small icon (favicon) in the browser tab', pass: facts.hasFavicon, weight: 5 },
    { key: 'ogImage', label: 'A preview image when your link is shared', pass: facts.hasOgImage, weight: 5 },
  ];

  const score = items.reduce((sum, i) => sum + (i.pass ? i.weight : 0), 0);

  return {
    score,
    items: items.map(({ key, label, pass }) => ({ key, label, pass })),
    facts,
  };
}
