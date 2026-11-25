// Splits a headline into words that rise into view one after another.
// Text wrapped in *asterisks* is set in red italic (the critic's emphasis).
// Pure CSS animation, so it costs nothing in JavaScript and shows instantly
// for people who reduce motion.

export default function Lines({ text, as: Tag = 'h1', className, delay = 0 }) {
  const parts = String(text).split(/(\*[^*]+\*)/).filter(Boolean);
  let i = 0;
  return (
    <Tag className={className}>
      {parts.map((part, p) => {
        const emphasis = part.startsWith('*') && part.endsWith('*');
        const words = (emphasis ? part.slice(1, -1) : part).split(/(\s+)/);
        const nodes = words.map((w, k) =>
          /^\s+$/.test(w) || !w ? (
            w
          ) : (
            <span className="line" key={k}>
              <span style={{ '--i': i++ + delay }}>{w}</span>
            </span>
          )
        );
        return emphasis ? <em key={p}>{nodes}</em> : <span key={p}>{nodes}</span>;
      })}
    </Tag>
  );
}
