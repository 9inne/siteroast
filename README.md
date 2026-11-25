# SiteRoast

The honest website review. Paste a link and SiteRoast reviews the site like a sharp critic: a score, real screenshots marked up in red pen, and the three fixes that matter most. Share the verdict or ask for a quote.

Built with Next.js 16 (JavaScript), Motion (animation), Lenis (smooth scrolling), Supabase and the Google PageSpeed Insights API. Claude writes the review and, when `ANTHROPIC_API_KEY` is set, also looks at the phone screenshot to critique the design and circle where each problem is. Without the key, built-in rules write the review and everything else works the same.

## How a roast works

1. **Home** (`components/RoastForm.js`): the visitor pastes a link. Their browser then does three things at once:
   - runs Google PageSpeed for **phone** and **laptop** (`lib/psi-client.js`). This takes 15–40 seconds, so it runs in the browser rather than on our server, which free hosting would time out.
   - asks our server to read the page's HTML for contact and trust checks (`app/api/check` → `lib/safe-fetch.js` + `lib/html-checks.js`).
2. The browser sends the short summary to `app/api/roast`, which:
   - scores four categories and an overall score (`lib/scoring.js`)
   - writes the headline and three fixes with Claude (reading the test results and the phone screenshot), or with built-in rules if Claude is slow, fails or has no key (`lib/verdict.js`)
   - saves the report in Supabase and returns its id.
3. **Review** at `/r/<id>`, **share** at `/r/<id>/share` (with an auto-made image at `/r/<id>/card`), and **quote form** at `/r/<id>/quote`, which saves to the `leads` table and can email you through Brevo.

## Safety built in

- The page reader blocks private and internal addresses, checked during the actual connection, so a site can't trick our server into reading internal systems.
- Supabase tables have Row Level Security on with no public access; only the server's secret key can read or write.
- Visitor IPs are stored only as salted hashes, used for limits: 10 roasts and 5 quote requests per hour per visitor.
- Known v1 limit: the PageSpeed numbers come from the visitor's browser, so a determined person could fake their own score. That only affects their own report; leads and the database are not at risk.

## Setup

1. **Supabase**: create a project, open SQL Editor and run `supabase/schema.sql`. Copy the Project URL and the secret key (Project settings → API keys).
2. **Google PageSpeed key**: in Google Cloud Console, enable "PageSpeed Insights API", create an API key, then restrict it to *HTTP referrers* (your domain, e.g. `https://siteroast.app/*`) and to the PageSpeed API only. It is visible in the browser, which is why the restriction matters.
3. **Claude key**: from console.anthropic.com. Optional; without it, the built-in rule-based copy is used.
4. Copy `.env.example` to `.env.local` and fill it in, then:

```bash
npm install
npm run dev
```

## Deploying on Netlify

Connect the GitHub repo in Netlify; `netlify.toml` already has the build settings. Add every variable from `.env.example` under Site configuration → Environment variables, set `NEXT_PUBLIC_SITE_URL` to the live address, then deploy.

