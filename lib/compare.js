// Works out the Head to Head result: the league table, the headline and the
// gaps the visitor has to close to take first place. Pure functions, no I/O.

const secs = (ms) => (ms / 1000).toFixed(1);
const mbText = (b) => `${(b / 1_000_000).toFixed(1)} MB`;
const ORDINAL = ['1st', '2nd', '3rd', '4th'];

// "crumbsandco.co.uk" → "crumbsandco", for friendlier sentences.
export const shortName = (host) => host.replace(/^www\./, '').split('.')[0];

const lcpOf = (r) => r.metrics?.mobile?.lcpMs ?? null;
const bytesOf = (r) => r.metrics?.mobile?.totalBytes ?? null;
const factsOf = (r) => r.metrics?.facts ?? null;
const cat = (r, key) => r.categories?.find((c) => c.key === key)?.score ?? null;

export function buildHeadToHead(you, rivals) {
  const all = [you, ...rivals];
  const ranked = [...all].sort((a, b) => b.score - a.score || (lcpOf(a) ?? 1e9) - (lcpOf(b) ?? 1e9));
  const position = ranked.indexOf(you); // 0 = first
  const leader = ranked[0] === you ? ranked[1] : ranked[0];

  // ---- headline (asterisks mark the red italic words) ----
  let headline;
  if (position === 0) {
    headline = `You’re *1st of ${all.length}*. You beat ${shortName(leader.host)} by ${you.score - leader.score} points.`;
  } else {
    const head = `You’re *${ORDINAL[position]} of ${all.length}*.`;
    const lYou = lcpOf(you);
    const lLead = lcpOf(leader);
    if (lYou && lLead && lYou - lLead >= 1000) {
      headline = `${head} ${shortName(leader.host)} opens ${secs(lYou - lLead)} seconds faster.`;
    } else {
      headline = `${head} ${shortName(leader.host)} scores ${leader.score - you.score} points higher.`;
    }
  }

  // ---- how to take (or keep) first place ----
  const gaps = [];
  const target = position === 0 ? null : leader;
  if (target) {
    const lYou = lcpOf(you);
    const lT = lcpOf(target);
    const bYou = bytesOf(you);
    const bT = bytesOf(target);
    if (bYou && bT && bYou > bT * 1.3 && lYou && lT && lYou > lT) {
      gaps.push({ text: `Shrink your page to ${shortName(target.host)}’s size (${mbText(bYou)} vs ${mbText(bT)})`, value: `−${secs(lYou - lT)} s` });
    } else if (lYou && lT && lYou - lT >= 500) {
      gaps.push({ text: `Load as fast as ${shortName(target.host)}`, value: `−${secs(lYou - lT)} s` });
    }

    const fYou = factsOf(you);
    const reachers = rivals.filter((r) => factsOf(r)?.reach).map((r) => shortName(r.host));
    if (fYou && !fYou.reach && reachers.length) {
      gaps.push({ text: `Add a call or chat button, like ${reachers.slice(0, 2).join(' and ')}`, value: '+ enquiries' });
    }
    const describers = rivals.filter((r) => factsOf(r)?.description).length;
    if (fYou && !fYou.description && describers) {
      const t = rivals.length;
      const who = t === 1 ? 'your rival has one' : describers === t ? (t === 2 ? 'both rivals have one' : `all ${t} rivals have one`) : `${describers} of ${t} rivals have one`;
      gaps.push({ text: `Write a Google description (${who})`, value: '+ clicks' });
    }

    for (const [key, name] of [['mobile', 'Mobile'], ['seo', 'Google'], ['contact', 'Contact & trust'], ['speed', 'Speed']]) {
      if (gaps.length >= 3) break;
      const y = cat(you, key);
      const t = cat(target, key);
      if (y != null && t != null && t - y >= 15) gaps.push({ text: `Close the ${name} gap: ${shortName(target.host)} ${t}, you ${y}`, value: `+${t - y} pts` });
    }
  } else {
    // Already first: point at the closest chaser's best area.
    const chaser = ranked[1];
    for (const [key, name] of [['speed', 'Speed'], ['mobile', 'Mobile'], ['seo', 'Google'], ['contact', 'Contact & trust']]) {
      const y = cat(you, key);
      const c = cat(chaser, key);
      if (y != null && c != null && c > y) gaps.push({ text: `${shortName(chaser.host)} beats you on ${name} (${c} vs ${y})`, value: `+${c - y} pts` });
      if (gaps.length >= 3) break;
    }
  }

  return { ranked, position, leader, headline, gaps: gaps.slice(0, 3) };
}
