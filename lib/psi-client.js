// Runs Google PageSpeed Insights from the visitor's browser.
// PSI can take 15–40 seconds, longer than free hosting lets a server function
// run, so the browser waits for it and only sends the short summary to us.

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const MAX_ISSUES = 6;
const MAX_SHOT_CHARS = 350_000;

export async function runPageSpeed(url, strategy, signal) {
  const params = new URLSearchParams({ url, strategy });
  CATEGORIES.forEach((c) => params.append('category', c));
  const key = process.env.NEXT_PUBLIC_PSI_KEY;
  if (key) params.set('key', key);

  const res = await fetch(`${ENDPOINT}?${params}`, { signal });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error || !json.lighthouseResult) {
    const reason = json?.error?.message || `PageSpeed error ${res.status}`;
    throw new Error(reason);
  }
  return summarize(json.lighthouseResult);
}

const plain = (s) => String(s || '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();

function issuesFor(lhr, categoryId) {
  const cat = lhr.categories?.[categoryId];
  if (!cat) return [];
  return cat.auditRefs
    .map((ref) => ({ ref, audit: lhr.audits[ref.id] }))
    .filter(
      ({ audit }) =>
        audit &&
        typeof audit.score === 'number' &&
        audit.score < 0.9 &&
        ['numeric', 'binary', 'metricSavings'].includes(audit.scoreDisplayMode)
    )
    .sort((a, b) => (b.ref.weight || 0) - (a.ref.weight || 0) || a.audit.score - b.audit.score)
    .slice(0, MAX_ISSUES)
    .map(({ audit }) => ({
      id: audit.id,
      title: plain(audit.title).slice(0, 140),
      value: plain(audit.displayValue).slice(0, 60),
    }));
}

function summarize(lhr) {
  const pct = (id) => {
    const s = lhr.categories?.[id]?.score;
    return typeof s === 'number' ? Math.round(s * 100) : null;
  };
  const num = (id) => {
    const v = lhr.audits?.[id]?.numericValue;
    return typeof v === 'number' ? Math.round(v) : null;
  };

  let shot = lhr.audits?.['final-screenshot']?.details?.data || null;
  if (shot && (!/^data:image\/(jpeg|webp|png);base64,/.test(shot) || shot.length > MAX_SHOT_CHARS)) shot = null;

  return {
    finalUrl: lhr.finalDisplayedUrl || lhr.finalUrl || lhr.requestedUrl,
    scores: {
      performance: pct('performance'),
      accessibility: pct('accessibility'),
      bestPractices: pct('best-practices'),
      seo: pct('seo'),
    },
    metrics: {
      lcpMs: num('largest-contentful-paint'),
      fcpMs: num('first-contentful-paint'),
      tbtMs: num('total-blocking-time'),
      speedIndexMs: num('speed-index'),
      totalBytes: num('total-byte-weight'),
    },
    viewportOk: lhr.audits?.viewport?.score === 1,
    issues: {
      performance: issuesFor(lhr, 'performance'),
      accessibility: issuesFor(lhr, 'accessibility'),
      bestPractices: issuesFor(lhr, 'best-practices'),
      seo: issuesFor(lhr, 'seo'),
    },
    screenshot: shot,
  };
}
