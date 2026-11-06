import Logo from '@/components/Logo';
import RoastForm from '@/components/RoastForm';
import ScoreRing from '@/components/ScoreRing';

function SampleCard() {
  return (
    <div className="sample-wrap" id="sample">
      <div className="card sample">
        <div className="sample-top">
          <span>example.com</span>
          <span>Sample report</span>
        </div>
        <div className="sample-main">
          <ScoreRing score={34} size={96} stroke={8} numSize={32} />
          <span className="sample-line">Loads in 9 seconds on a phone. Many visitors won’t wait that long.</span>
        </div>
        <ul className="sample-fixes">
          <li><span>Shrink your images</span><span>Fix 1</span></li>
          <li><span>Add a clear way to contact you</span><span>Fix 2</span></li>
          <li><span>Say what you do in the headline</span><span>Fix 3</span></li>
        </ul>
      </div>
    </div>
  );
}

const STEPS = [
  ['01', 'Paste your link', 'Any website. No account, no card.'],
  ['02', 'Get the honest verdict', 'A score, real screenshots, and your top three fixes in plain English.'],
  ['03', 'Fix it, or have it fixed', 'Do it yourself, or get a free quote from a designer.'],
];

export default function Home() {
  return (
    <div className="page">
      <RoastForm
        header={
          <header className="topbar">
            <Logo />
            <nav className="topbar-nav" aria-label="Main">
              <a className="topbar-link" href="#how">How it works</a>
              <a className="topbar-link topbar-link--wide" href="#sample">Sample report</a>
            </nav>
          </header>
        }
        sample={<SampleCard />}
      >
        <section id="how" className="steps" aria-label="How it works">
          {STEPS.map(([n, title, text]) => (
            <div className="step" key={n}>
              <span className="step-num">{n}</span>
              <h2 className="step-title">{title}</h2>
              <p>{text}</p>
            </div>
          ))}
        </section>
        <footer className="footer">
          <span>© {new Date().getFullYear()} SiteRoast</span>
          <span>Free website audits for small businesses.</span>
        </footer>
      </RoastForm>
    </div>
  );
}
