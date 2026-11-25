// Runs Google PageSpeed Insights from the visitor's browser.
// PSI can take 15–40 seconds, longer than free hosting lets a server function
// run, so the browser waits for it and only sends the short summary to us.

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const MAX_ISSUES = 6;
const MAX_SHOT_CHARS = 800_000; // ~600 KB image at most, to keep the database small

// The part of the page we show: the first screen, in the frame's shape.
const FRAME = { mobile: 18.5 / 9, desktop: 10 / 16 }; // height ÷ width

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
  const summary = summarize(json.lighthouseResult);
  summary.screenshot = await bestScreenshot(json.lighthouseResult, strategy).catch(() => summary.screenshot);
  return summary;
}

// Google returns two screenshots: a small, heavily compressed "final" one and a
// larger, better-quality full-page one. We take whichever is wider (sharper),
// crop it to the first screen, and save it once as a good-quality JPEG.
async function bestScreenshot(lhr, strategy) {
  const finalShot = lhr.audits?.['final-screenshot']?.details;
  const full = lhr.fullPageScreenshot?.screenshot;
  const candidates = [full, finalShot].filter((c) => c?.data && /^data:image\/(jpeg|webp|png);base64,/.test(c.data));
  if (!candidates.length) return null;

  const img = await loadImage(candidates.sort((a, b) => (b.width || 0) - (a.width || 0))[0].data);
  const w = img.naturalWidth;
  const h = Math.min(img.naturalHeight, Math.round(w * (FRAME[strategy] || FRAME.mobile)));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);

  for (const quality of [0.85, 0.78, 0.7, 0.6]) {
    const out = canvas.toDataURL('image/jpeg', quality);
    if (out.length <= MAX_SHOT_CHARS) return out;
  }
  return null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
