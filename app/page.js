import Masthead from '@/components/Logo';
import RoastForm from '@/components/RoastForm';
import Plate, { SAMPLE_MARKS } from '@/components/Plate';
import Reveal from '@/components/Reveal';

const CRITERIA = [
  ['Speed', 'How long they wait on a phone.'],
  ['Mobile', 'Whether it fits and taps cleanly.'],
  ['Google', 'Whether search can find and show you.'],
  ['Contact & trust', 'How fast they can reach you.'],
];

const STEPS = [
  ['Paste your link', 'Any website. No account, no card.'],
  ['Read the review', 'A score, real screenshots and the three fixes that matter most.'],
  ['Fix it, or have it fixed', 'Do it yourself, or get a free quote from a designer.'],
];

export default function Home() {
  return (
    <>
      <Masthead right={<a className="mast-link" href="#how">How it works</a>} />
      <main className="page">
        <RoastForm
          sample={
            <div className="fade" style={{ '--dl': '.4s' }}>
              <Plate
                sample
                marks={SAMPLE_MARKS}
                notes
                loop={7600}
                delay={0.9}
                stagger={0.9}
                alt="A sample bakery homepage with three problems circled in red"
                caption={<><em>Fig. 1</em> <span className="kicker">· Sample review, on a phone</span></>}
              />
            </div>
          }
        >
          <section className="judge" id="how" aria-label="What we judge">
            <Reveal>
              <span className="kicker">What we judge</span>
              <h2>Four things your customers <em>notice</em>.</h2>
            </Reveal>
            <ul className="crit">
              {CRITERIA.map(([name, text], i) => (
                <Reveal as="li" key={name} delay={i * 0.08}>
                  <b>{name}</b>
                  <span>{text}</span>
                </Reveal>
              ))}
            </ul>
          </section>

          <section className="steps" aria-label="How it works">
            {STEPS.map(([title, text], i) => (
              <Reveal className="step" key={title} delay={i * 0.1}>
                <span className="n" aria-hidden="true">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </section>

          <footer className="foot kicker">
            <span>© {new Date().getFullYear()} SiteRoast</span>
            <span>The honest website review</span>
          </footer>
        </RoastForm>
      </main>
    </>
  );
}
