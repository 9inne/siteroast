// Turns raw check results into SiteRoast's four categories and one overall score.

const WEIGHTS = { speed: 0.35, mobile: 0.25, seo: 0.2, contact: 0.2 };

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const secs = (ms) => (ms / 1000).toFixed(1).replace(/\.0$/, '');
const mb = (bytes) => (bytes / 1_000_000).toFixed(1);

export function scoreLabel(score) {
  if (score >= 90) return { text: 'Excellent', tone: 'good' };
  if (score >= 70) return { text: 'Solid', tone: 'good' };
  if (score >= 40) return { text: 'Getting there', tone: 'mid' };
  return { text: 'Needs work', tone: 'bad' };
}

export function barColor(score) {
  if (score == null) return 'var(--line-3)';
  if (score >= 70) return 'var(--good)';
  if (score >= 50) return 'var(--mid)';
  if (score >= 35) return 'var(--warn)';
  return 'var(--bad)';
}

export function buildCategories({ mobile, checks }) {
  const m = mobile;
  const speedNotes = [];
  if (m.metrics.lcpMs) speedNotes.push(`Main content appears after ${secs(m.metrics.lcpMs)} seconds on a phone`);
  if (m.metrics.totalBytes) speedNotes.push(`The page downloads ${mb(m.metrics.totalBytes)} MB`);

  const mobileScore = clamp(
    0.45 * (m.scores.accessibility ?? 50) + 0.35 * (m.scores.bestPractices ?? 50) + 0.2 * (m.viewportOk ? 100 : 0)
  );

  const categories = [
    {
      key: 'speed',
      name: 'Speed',
      score: clamp(m.scores.performance ?? 0),
      issues: [...speedNotes, ...m.issues.performance.map((i) => (i.value ? `${i.title} (${i.value})` : i.title))],
    },
    {
      key: 'mobile',
      name: 'Mobile',
      score: mobileScore,
      issues: [
        ...(m.viewportOk ? [] : ['The page is not set up to fit phone screens']),
        ...m.issues.accessibility.map((i) => i.title),
        ...m.issues.bestPractices.map((i) => i.title),
      ].slice(0, 8),
    },
    {
      key: 'seo',
      name: 'SEO',
      score: clamp(m.scores.seo ?? 0),
      issues: m.issues.seo.map((i) => i.title),
    },
    {
      key: 'contact',
      name: 'Contact & trust',
      score: checks ? clamp(checks.score) : null,
      issues: checks ? checks.items.filter((i) => !i.pass).map((i) => `Missing: ${i.label.toLowerCase()}`) : [],
    },
  ];

  let total = 0;
  let weight = 0;
  for (const c of categories) {
    if (c.score == null) continue;
    total += c.score * WEIGHTS[c.key];
    weight += WEIGHTS[c.key];
  }
  const score = weight ? clamp(total / weight) : 0;

  return { score, categories };
}
