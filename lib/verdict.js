import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Writes the roast: one punchy headline and the top three fixes.
// Uses Claude when a key is set; otherwise (or if it is slow or fails)
// falls back to rule-based copy, so a report is always produced.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const AI_TIMEOUT_MS = 7000;

const secs = (ms) => (ms / 1000).toFixed(1).replace(/\.0$/, '');
const mb = (bytes) => (bytes / 1_000_000).toFixed(1);

function factSheet({ host, mobile, checks, categories, score }) {
  const f = checks?.facts || {};
  return {
    website: host,
    overallScore: score,
    categoryScores: Object.fromEntries(categories.map((c) => [c.name, c.score])),
    phoneLoadSeconds: mobile.metrics.lcpMs ? Number(secs(mobile.metrics.lcpMs)) : null,
    pageWeightMB: mobile.metrics.totalBytes ? Number(mb(mobile.metrics.totalBytes)) : null,
    pageTitle: f.title || null,
    mainHeadline: f.h1 || null,
    hasGoogleDescription: checks ? Boolean(f.description) : null,
    customerCanContact: checks
      ? { phone: f.hasPhone, email: f.hasEmail, whatsapp: f.hasWhatsApp, form: f.hasForm, contactPage: f.hasContactPage }
      : 'not checked',
    secure: checks ? f.https : null,
    topSpeedProblems: mobile.issues.performance.slice(0, 4).map((i) => i.title),
    topSeoProblems: mobile.issues.seo.slice(0, 3).map((i) => i.title),
    topMobileProblems: [...mobile.issues.accessibility, ...mobile.issues.bestPractices].slice(0, 3).map((i) => i.title),
  };
}

const SYSTEM = `You write the verdict for SiteRoast, a free website audit for small business owners worldwide.
Tone: confident, witty and direct, like a sharp friend who builds websites. Never insult the owner. No slang, no emojis.
Write for non-technical people: never use jargon such as LCP, CLS, render-blocking, DOM, minify or SEO acronyms. Say what the problem costs them (visitors, enquiries, sales).
Use only the facts provided. Do not invent statistics or numbers that are not in the facts.

Return ONLY a JSON object, no other text:
{"headline": string, "fixes": [{"title": string, "body": string, "impact": string}, ...exactly 3]}
- headline: max 110 characters, one or two short sentences, specific to this site, using a real number from the facts when there is one.
- fixes: the three changes that would help this business most, most important first.
  title: max 45 characters, starts with a verb. body: max 170 characters, plain English, what to do and why. impact: 2 to 4 words, e.g. "Faster loading", "More enquiries".`;

function parseVerdict(text) {
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const v = JSON.parse(match[0]);
    const s = (x, n) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, n);
    if (!v.headline || !Array.isArray(v.fixes) || v.fixes.length < 3) return null;
    const fixes = v.fixes.slice(0, 3).map((x) => ({ title: s(x.title, 60), body: s(x.body, 220), impact: s(x.impact, 32) }));
    if (fixes.some((x) => !x.title || !x.body)) return null;
    return { headline: s(v.headline, 140), fixes };
  } catch {
    return null;
  }
}

async function aiVerdict(facts) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: AI_TIMEOUT_MS, maxRetries: 0 });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Facts about the website:\n${JSON.stringify(facts, null, 2)}` }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return parseVerdict(text);
}

function ruleVerdict({ mobile, checks, score }) {
  const f = checks?.facts;
  const lcp = mobile.metrics.lcpMs;
  const bytes = mobile.metrics.totalBytes;

  let headline;
  if (lcp && lcp > 4000) headline = `Your site takes ${secs(lcp)} seconds to show up on a phone. Many visitors won't wait that long.`;
  else if (f && !(f.hasPhone || f.hasEmail || f.hasWhatsApp || f.hasForm))
    headline = 'People can find your site, but they have no quick way to contact you.';
  else if (score >= 80) headline = 'Solid site. A few small fixes would make it even better.';
  else headline = `Your site scores ${score}/100. A few focused fixes would make a real difference.`;

  const candidates = [];
  if (bytes && bytes > 3_000_000)
    candidates.push({ title: 'Shrink your images', body: `Your page downloads ${mb(bytes)} MB. Compressing photos and using modern formats could cut load time a lot.`, impact: 'Faster loading' });
  if (lcp && lcp > 2500)
    candidates.push({ title: 'Make your page load faster', body: `Your main content takes ${secs(lcp)} seconds to appear on phones. Aim for under 2.5 seconds.`, impact: 'Visitors stay longer' });
  if (f && !(f.hasPhone || f.hasEmail || f.hasWhatsApp || f.hasForm))
    candidates.push({ title: 'Add a clear way to contact you', body: 'Put a tap-to-call, email or chat button where people can see it without scrolling.', impact: 'More enquiries' });
  if (f && !f.https)
    candidates.push({ title: 'Switch your site to https', body: 'Browsers warn visitors that your site is "not secure". Most hosts turn this on for free.', impact: 'More trust' });
  if (f && !f.h1)
    candidates.push({ title: 'Say what you do in a headline', body: 'Your page has no clear main headline. Lead with what you offer and who it is for.', impact: 'Clearer message' });
  if (f && !f.description)
    candidates.push({ title: 'Write a Google description', body: 'Add a short summary of your business so Google shows a helpful snippet under your link.', impact: 'More clicks from Google' });
  if (!mobile.viewportOk)
    candidates.push({ title: 'Make your site fit phone screens', body: 'Your page is not set up for phones, so visitors have to pinch and zoom to read it.', impact: 'Better on phones' });
  for (const i of mobile.issues.seo)
    candidates.push({ title: 'Fix a Google search issue', body: `${i.title}. Fixing it helps Google understand and rank your page.`, impact: 'More visibility' });
  for (const i of mobile.issues.accessibility)
    candidates.push({ title: 'Make your site easier to use', body: `${i.title}. Small fixes like this help every visitor.`, impact: 'Easier to use' });
  candidates.push(
    { title: 'Add customer reviews', body: 'Show a few real reviews or client logos near the top so new visitors trust you faster.', impact: 'More trust' },
    { title: 'Make your main button stand out', body: 'Give your most important action one bold, clear button so visitors know what to do next.', impact: 'More enquiries' },
    { title: 'Check your site on a phone', body: 'Open it on your own phone and try to contact yourself. Fix anything that feels slow or awkward.', impact: 'Better experience' }
  );

  const seen = new Set();
  const fixes = candidates.filter((c) => !seen.has(c.title) && seen.add(c.title)).slice(0, 3);
  return { headline, fixes };
}

export async function writeVerdict(input) {
  try {
    const ai = await aiVerdict(factSheet(input));
    if (ai) return { ...ai, source: 'ai' };
  } catch (err) {
    console.error('AI verdict failed, using rules:', err?.message);
  }
  return { ...ruleVerdict(input), source: 'rules' };
}
