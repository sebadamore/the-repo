/**
 * Seed script — Sign-in / Sign-up UX benchmark
 * Run: node seed-signup.js
 * Requires server running on localhost:3344
 */

const BASE = 'http://localhost:3344';

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function put(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`PUT ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC = {
  name: 'Sign-up / Sign-in',
  icon: '🔐',
  description: 'How 12 SaaS tools handle account creation, authentication options, friction during sign-up, and the post-signup onboarding into the product. Same tools as the sharing benchmark.',
  dimensions: [
    { name: 'Auth methods' },
    { name: 'Sign-up friction' },
    { name: 'Post-signup onboarding' }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'Stormboard',
    category: 'Whiteboard',
    pricing: 'Free / Business / Enterprise',
    url: 'https://stormboard.com',
    summary: 'Data-first digital whiteboard. Conservative auth posture: email + password only on standard plans, SAML SSO gated to Enterprise. No OAuth providers for individual users.',
    sources: [
      { label: 'Sign up page', url: 'https://stormboard.com/signup' },
      { label: 'SSO documentation', url: 'https://help.stormboard.com/en/articles/enterprise-sso' },
      { label: 'G2 reviews – auth pain', url: 'https://www.g2.com/products/stormboard/reviews' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'bad',
        verdictLabel: 'Email-only for standard plans',
        keyline: 'Standard and Business plans support email + password only. Google, Microsoft, and Apple OAuth are absent. Enterprise gets SAML SSO but nothing simpler in between.',
        bullets: [
          'No Google, Microsoft, or Apple OAuth on Free or Business tiers.',
          'Enterprise SAML SSO available via Okta, Azure AD, and similar IdPs.',
          'Password reset via email — no magic link option.',
          'No social login anywhere in the product.'
        ]
      },
      'sign-up-friction': {
        verdict: 'warn',
        verdictLabel: 'Email verification required, no fast path',
        keyline: 'Creating an account requires filling a form, then confirming via email before accessing the product. No OAuth shortcut means higher drop-off than competitors.',
        bullets: [
          'Email + first name + last name + password required at signup.',
          'Confirmation email must be clicked before access is granted.',
          'No credit card required on Free tier.',
          'Account creation is the only path — no anonymous or guest preview.',
          'G2 reviewers cite login friction as a recurring complaint.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'Dashboard drop with minimal guidance',
        keyline: 'After confirming email, users land in a dashboard with a "Create Storm" button but no guided wizard or interactive tutorial. Template library exists but is not surfaced prominently at first login.',
        bullets: [
          'No step-by-step setup wizard.',
          'A sample Storm may be pre-created on some plans — not consistent.',
          'Template gallery accessible from the dashboard but not auto-shown.',
          'No use-case personalization step.',
          'Tooltip tour is minimal and can be dismissed accidentally.'
        ]
      }
    }
  },

  {
    name: 'Miro',
    category: 'Whiteboard',
    pricing: 'Free / Starter / Business / Enterprise',
    url: 'https://miro.com',
    summary: 'Category leader with broad OAuth coverage, a fast signup path, and one of the most polished onboarding flows in the whiteboard space — including an interactive demo board.',
    sources: [
      { label: 'Sign up page', url: 'https://miro.com/signup/' },
      { label: 'SSO & provisioning', url: 'https://help.miro.com/hc/en-us/articles/360017730533-SSO-SAML' },
      { label: 'Getting started guide', url: 'https://help.miro.com/hc/en-us/articles/360017730813' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Broad OAuth + enterprise SSO',
        keyline: 'Google, Microsoft, Slack, and Apple login all available out of the box. Enterprise adds SAML SSO with SCIM provisioning. Best OAuth coverage in the whiteboard category.',
        bullets: [
          'Google, Microsoft, Slack, Apple OAuth — all supported at signup.',
          'Email + password also available.',
          'Enterprise: SAML 2.0 SSO with SCIM user provisioning (Okta, Azure, OneLogin).',
          'Magic link / passwordless not offered.',
          '2FA available via authenticator app or SMS.'
        ]
      },
      'sign-up-friction': {
        verdict: 'good',
        verdictLabel: 'Fast OAuth, no credit card required',
        keyline: 'Google OAuth signup completes in 2–3 clicks. No credit card on Free. No phone verification. Email verification is skipped when using OAuth, making the path to the product very fast.',
        bullets: [
          'Google/Microsoft OAuth skips email verification entirely.',
          'Free plan requires no credit card.',
          'Email/password path does require email confirmation.',
          'No phone verification — available everywhere.',
          'Workspace name is collected post-signup, not blocking first use.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'good',
        verdictLabel: 'Interactive tutorial board + team setup',
        keyline: 'New users are offered a guided onboarding board that demonstrates core features interactively. Team invite step and template picker follow. Skip options are prominent throughout.',
        bullets: [
          'Optional interactive tutorial board that shows sticky notes, frames, and connectors in action.',
          'Team name and logo collection on first login.',
          'Template gallery shown immediately with filtered views by use case.',
          '"Skip for now" available at every step.',
          'Email invite flow integrated into the onboarding sequence.'
        ]
      }
    }
  },

  {
    name: 'FigJam (Figma)',
    category: 'Whiteboard',
    pricing: 'Free / Pro / Org / Enterprise',
    url: 'https://figma.com/figjam',
    summary: 'Inherits Figma\'s mature auth stack: Google, GitHub, and SSO. Signup includes a role survey and team setup before reaching the canvas, which adds steps but also personalizes the experience.',
    sources: [
      { label: 'Create a Figma account', url: 'https://help.figma.com/hc/en-us/articles/360039811114' },
      { label: 'SAML SSO setup', url: 'https://help.figma.com/hc/en-us/articles/360040328394' },
      { label: 'G2 reviews', url: 'https://www.g2.com/products/figma/reviews' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Google, GitHub + enterprise SSO',
        keyline: 'Google and GitHub OAuth cover the two largest developer and designer audiences. Enterprise SAML SSO with SCIM available on Org and Enterprise plans.',
        bullets: [
          'Google OAuth — primary path for most users.',
          'GitHub OAuth — important for developer-adjacent users.',
          'Email + password supported.',
          'SAML SSO + SCIM provisioning on Org / Enterprise.',
          'No Apple login, no Microsoft OAuth.',
          '2FA via authenticator app available.'
        ]
      },
      'sign-up-friction': {
        verdict: 'warn',
        verdictLabel: 'Role survey before first canvas',
        keyline: 'After OAuth, Figma asks "what do you primarily use Figma for?" and collects role, team type, and intended use. Useful for personalization but adds 2–3 screens of friction before reaching a blank file.',
        bullets: [
          'Google OAuth completes account creation in 1 click — then a 3-screen survey begins.',
          '"What\'s your role?" picker (designer, developer, PM, student, other).',
          '"What are you working on?" and team-size questions follow.',
          'Education pricing flow is a separate branch with .edu email verification.',
          'No credit card required on Free.',
          'Email verification required for email/password path.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'Role-based setup, multi-step before canvas',
        keyline: 'Post-survey, users see a team creation or join step, then a template picker. The overall sequence is 4–5 screens before a blank FigJam opens. Well-structured but noticeably longer than Miro or Canva.',
        bullets: [
          'Team name creation or invitation to join an existing team.',
          'Template picker shown — FigJam-specific templates highlighted.',
          'First canvas is a selected template or blank board.',
          'No interactive tutorial; FigJam relies on toolbar tooltips.',
          'Onboarding completion takes 2–3 min on average vs ~30s for Miro.'
        ]
      }
    }
  },

  {
    name: 'Lucidspark',
    category: 'Whiteboard',
    pricing: 'Free / Individual / Team / Enterprise',
    url: 'https://lucidspark.com',
    summary: 'Part of the Lucid suite. Google and Microsoft OAuth on all plans. Sign-up is straightforward, and the template-first onboarding is a strength — though workspace configuration adds extra steps.',
    sources: [
      { label: 'Getting started with Lucidspark', url: 'https://help.lucid.co/hc/en-us/articles/lucidspark-getting-started' },
      { label: 'SSO documentation', url: 'https://help.lucid.co/hc/en-us/articles/sso' },
      { label: 'G2 reviews', url: 'https://www.g2.com/products/lucidspark/reviews' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Google + Microsoft OAuth on all plans',
        keyline: 'Google and Microsoft OAuth cover the enterprise and education audiences well. SAML SSO with Okta, Azure AD, and Google Workspace available on Team and Enterprise.',
        bullets: [
          'Google OAuth — available on all plans including Free.',
          'Microsoft OAuth — available on all plans.',
          'Email + password also supported.',
          'SAML SSO on Team and Enterprise (Okta, Azure AD, Google Workspace).',
          'No Apple, GitHub, or Slack OAuth.',
          '2FA available.'
        ]
      },
      'sign-up-friction': {
        verdict: 'warn',
        verdictLabel: 'More steps than direct competitors',
        keyline: 'Signup collects name, role, team size, and workspace name before landing in the product. Each screen is lightweight, but the total step count is higher than Miro or Whimsical.',
        bullets: [
          'Google OAuth is 2 clicks, then enters a 3-screen onboarding survey.',
          'Asks for first/last name even when using Google (already available).',
          'Role and company size fields required.',
          'Workspace name collection before first board.',
          'No credit card on Free.',
          'No phone verification.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'good',
        verdictLabel: 'Template-first onboarding with use-case picker',
        keyline: 'After setup, users are dropped into a template gallery filtered by use case. The template picker is one of the better implementations in the category — specific, categorized, and searchable.',
        bullets: [
          'Template gallery is the default landing view after signup.',
          'Templates categorized by team (Marketing, Engineering, Product, Design, etc.).',
          'Quick-start templates for retrospectives, brainstorms, and planning.',
          'Optional "Explore Lucidspark" tooltip tour.',
          'Team invite prompt shown but not blocking.',
          'Blank board also accessible as a first option.'
        ]
      }
    }
  },

  {
    name: 'Whimsical',
    category: 'Whiteboard',
    pricing: 'Free / Pro / Business / Enterprise',
    url: 'https://whimsical.com',
    summary: 'Minimalist tool with a clean, low-friction signup. Google and Microsoft OAuth. Post-signup experience is lean — drops to workspace with minimal hand-holding, which suits experienced users but can disorient newcomers.',
    sources: [
      { label: 'Sign up', url: 'https://whimsical.com/signup' },
      { label: 'SSO docs', url: 'https://whimsical.com/docs/sso' },
      { label: 'G2 reviews', url: 'https://www.g2.com/products/whimsical/reviews' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'warn',
        verdictLabel: 'Google + Microsoft only',
        keyline: 'Google and Microsoft OAuth work well, but no Apple, GitHub, or Slack. Enterprise SAML SSO is available. The absence of Apple login is a minor gap for individual Mac users.',
        bullets: [
          'Google OAuth — works on all plans.',
          'Microsoft OAuth — works on all plans.',
          'Email + password available.',
          'Enterprise SAML SSO available.',
          'No Apple, GitHub, Facebook, or Slack OAuth.',
          'Magic link / passwordless not offered.'
        ]
      },
      'sign-up-friction': {
        verdict: 'good',
        verdictLabel: 'Clean, minimal signup flow',
        keyline: 'Google OAuth lands you in Whimsical in under 10 seconds. No survey, no workspace name prompt, no phone verification. One of the fastest paths to first use in the category.',
        bullets: [
          'Google OAuth: click, confirm Google account, enter Whimsical. ~3 seconds.',
          'No role survey or use-case picker during signup.',
          'No credit card required on Free.',
          'No phone number collection.',
          'Email/password path requires email confirmation — no shortcut there.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'Drops to workspace — limited guidance',
        keyline: 'Users land in an empty workspace with a sidebar showing project types (Flowcharts, Wireframes, Docs, Boards). No interactive tour or wizard. Clean but assumes users already know what they want.',
        bullets: [
          'No guided tutorial or interactive onboarding sequence.',
          'Left sidebar prompts creation by file type.',
          'Keyboard shortcut hint shown on blank canvas.',
          'No template gallery shown at first login.',
          'Feature discovery is largely self-directed.'
        ]
      }
    }
  },

  {
    name: 'tldraw',
    category: 'Whiteboard',
    pricing: 'Free web app / SDK',
    url: 'https://tldraw.com',
    summary: 'Open-source canvas that requires no account to use. GitHub OAuth for account features. The zero-friction anonymous start is unmatched in the category, though the trade-off is limited persistence and collaboration without an account.',
    sources: [
      { label: 'tldraw.com', url: 'https://tldraw.com' },
      { label: 'GitHub repo', url: 'https://github.com/tldraw/tldraw' },
      { label: 'tldraw blog', url: 'https://tldraw.substack.com' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'No account required — GitHub OAuth for extras',
        keyline: 'Anonymous use is the default. GitHub OAuth unlocks persistent rooms and sharing features. No other OAuth providers, but for a free open-source tool, the model is intentionally minimal.',
        bullets: [
          'Anyone can open tldraw.com and start drawing immediately — no account, no signup.',
          'GitHub OAuth available for account creation.',
          'No Google, Microsoft, or Apple login.',
          'No enterprise SSO.',
          'Anonymous boards are ephemeral unless explicitly saved or shared via URL.'
        ]
      },
      'sign-up-friction': {
        verdict: 'good',
        verdictLabel: 'Zero friction — anonymous start',
        keyline: 'No signup required to use the product. The canvas is live on page load. Signing in via GitHub adds persistence but is never required. Friction is effectively zero for first-time use.',
        bullets: [
          'Page load = usable canvas. No gate of any kind.',
          'GitHub OAuth takes ~10 seconds if needed.',
          'No email, no password, no verification, no survey.',
          'No credit card.',
          'No phone number.',
          'Saved files live in browser localStorage without an account.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'No onboarding — toolbar discoverability required',
        keyline: 'tldraw drops directly onto the canvas. No tutorial, no tooltip tour, no template gallery. The toolbar is compact and mostly self-explanatory, but users unfamiliar with whiteboard tools will have to explore on their own.',
        bullets: [
          'No welcome screen, wizard, or tutorial of any kind.',
          'Toolbar icons are unlabeled — hover reveals tooltips.',
          'Keyboard shortcut reference available via "?" key.',
          'No template library at the product level (though templates exist via embed/SDK).',
          'Community resources exist but are not surfaced in the UI.'
        ]
      }
    }
  },

  {
    name: 'Notion',
    category: 'Docs & notes',
    pricing: 'Free / Plus / Business / Enterprise',
    url: 'https://notion.so',
    summary: 'Sets the bar for post-signup onboarding in the productivity category. Magic link login, Google and Apple OAuth, and a use-case wizard that personalizes the workspace before first use.',
    sources: [
      { label: 'Sign up for Notion', url: 'https://www.notion.so/signup' },
      { label: 'SAML SSO guide', url: 'https://www.notion.so/help/saml-sso' },
      { label: 'Getting started guide', url: 'https://www.notion.so/help/getting-started' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Magic link + Google + Apple + SSO',
        keyline: 'Magic link (passwordless email login) is the default and recommended path. Google and Apple OAuth also supported. Enterprise SAML SSO with SCIM on Enterprise plan.',
        bullets: [
          'Email magic link — the default signup path. No password ever required.',
          'Google OAuth supported on all plans.',
          'Apple OAuth supported on all plans.',
          'No Microsoft or GitHub OAuth.',
          'Enterprise SAML SSO with SCIM provisioning.',
          '2FA available via authenticator app.'
        ]
      },
      'sign-up-friction': {
        verdict: 'good',
        verdictLabel: 'Smooth magic link, minimal required fields',
        keyline: 'Enter an email, click a link, done — no password to create or remember. Google OAuth is even faster. The use-case survey comes after account creation, not before, so it never blocks access.',
        bullets: [
          'Magic link requires email only — no password, no phone number.',
          'Google OAuth takes 1 click after selecting the account.',
          'No credit card required on Free.',
          'Use-case picker appears after account is created — non-blocking.',
          'No phone verification.',
          'No workspace-name prompt at signup (set later in settings).'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'good',
        verdictLabel: 'Best-in-class onboarding wizard',
        keyline: 'Notion\'s onboarding is the most polished in this benchmark. A use-case picker personalizes sidebar templates, a getting-started checklist guides first steps, and inline hints explain each UI element on first encounter.',
        bullets: [
          '"What will you use Notion for?" picker (Personal, Team, School).',
          'Role and team-size collection for team workspaces.',
          'Pre-populated sidebar with relevant templates based on use-case answers.',
          'Getting-started checklist in the sidebar with progress tracking.',
          '"Learn the basics" interactive page pre-created in every new workspace.',
          'Invite teammates step built into the onboarding sequence.'
        ]
      }
    }
  },

  {
    name: 'Evernote',
    category: 'Docs & notes',
    pricing: 'Free / Personal / Professional / Teams',
    url: 'https://evernote.com',
    summary: 'Veteran note-taking app with Google and Apple OAuth. The signup is functional but dated, and the post-signup experience pushes users toward paid plans early — a friction point that reviewers consistently flag.',
    sources: [
      { label: 'Create an account', url: 'https://evernote.com/signup' },
      { label: 'G2 reviews', url: 'https://www.g2.com/products/evernote/reviews' },
      { label: 'Capterra reviews', url: 'https://www.capterra.com/p/25013/Evernote/' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'warn',
        verdictLabel: 'Google + Apple, no Microsoft',
        keyline: 'Google and Apple OAuth cover the major consumer platforms but Microsoft login is absent — a notable gap for enterprise and education users who rely on Microsoft accounts.',
        bullets: [
          'Google OAuth available on all plans.',
          'Apple OAuth available on all plans.',
          'No Microsoft, GitHub, or Slack OAuth.',
          'Email + password supported (requires email confirmation).',
          'No SAML SSO on any standard plan — Teams plan uses separate access controls.',
          'No magic link / passwordless option.'
        ]
      },
      'sign-up-friction': {
        verdict: 'warn',
        verdictLabel: 'Upsell pressure during signup flow',
        keyline: 'The signup process surfaces plan comparison and paid-plan promotion before users have reached their first note. Free plan limitations are shown prominently, creating a pressure pattern before any value is delivered.',
        bullets: [
          'Google OAuth completes account creation quickly.',
          'Plan selection screen shown immediately post-auth — before first use.',
          'Free plan limitations (1 device sync, 60MB upload) surfaced prominently.',
          'Upgrade prompt appears in multiple places during first session.',
          'No phone verification required.',
          'No credit card on Free, but paid plan CTAs are aggressive.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'Dated onboarding with early paywall prompts',
        keyline: 'Evernote creates a "Getting Started" note and shows a brief feature tour, but the UX feels dated compared to Notion. Paywall messaging and upgrade nudges appear within the first 60 seconds.',
        bullets: [
          'Auto-created "Getting Started" note with feature overview.',
          'Optional short video tutorial in the onboarding note.',
          'Left sidebar prompts are standard but not personalized.',
          'No use-case picker or workspace personalization.',
          'Plan upgrade CTA visible in sidebar from first login.',
          'Mobile app install prompt shown early — cross-device upsell.'
        ]
      }
    }
  },

  {
    name: 'Canva',
    category: 'Design',
    pricing: 'Free / Pro / Teams / Enterprise',
    url: 'https://canva.com',
    summary: 'The broadest OAuth coverage in this benchmark. Canva\'s signup is fast, the use-case picker is smart, and the path from "I have an account" to "I\'m designing something" is the shortest in the category.',
    sources: [
      { label: 'Sign up for Canva', url: 'https://www.canva.com/signup/' },
      { label: 'SSO for Canva for Teams', url: 'https://www.canva.com/help/sso/' },
      { label: 'G2 reviews', url: 'https://www.g2.com/products/canva/reviews' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Broadest OAuth — Google, Apple, Facebook, Microsoft',
        keyline: 'Canva supports more OAuth providers than any other tool in this benchmark. Google, Apple, Facebook, and Microsoft are all available at signup, covering virtually every user.',
        bullets: [
          'Google OAuth — primary path for most users.',
          'Apple OAuth — important for iOS/macOS users.',
          'Facebook login — unusual in B2B tools, useful for creators.',
          'Microsoft OAuth — covers enterprise and education.',
          'Email + password also available.',
          'Enterprise SSO via SAML 2.0 on Teams and Enterprise plans.'
        ]
      },
      'sign-up-friction': {
        verdict: 'good',
        verdictLabel: 'One of the fastest signups in the category',
        keyline: 'Google OAuth resolves in 2 clicks. The subsequent use-case picker (student, teacher, business, personal) is 1 screen and immediately personalizes the experience without feeling like a survey.',
        bullets: [
          'Google OAuth: 2 clicks to account creation.',
          '"I am a…" picker (Student, Teacher, Business owner, Personal) — 1 click.',
          'No role-by-role survey, no team-size field, no workspace naming.',
          'No credit card on Free.',
          'No phone verification.',
          'Education path has a separate .edu email verification branch.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'good',
        verdictLabel: 'Personalized onboarding, fast to first canvas',
        keyline: 'After the 1-click use-case picker, Canva shows a filtered design type grid (presentations, social posts, logos, etc.) and drops the user into a blank editor within 20 seconds of signup. Polished and purposeful.',
        bullets: [
          '"What will you design first?" grid shown immediately after use-case selection.',
          'Designs are pre-categorized by the role selected (e.g., teachers see worksheets and certificates).',
          'First canvas opens with inline hints for key tools.',
          'No forced tutorial — hints can be dismissed.',
          'Team invite available post-onboarding, not during.',
          'Mobile app install prompt shown after first design, not at signup.'
        ]
      }
    }
  },

  {
    name: 'Lovable',
    category: 'AI Builder',
    pricing: 'Free / Pro / Business / Enterprise',
    url: 'https://lovable.dev',
    summary: 'AI-powered app builder. GitHub OAuth is the primary auth path, which creates a structural barrier for non-developer users. Once past signup, the prompt-driven onboarding is fast and produces immediate output.',
    sources: [
      { label: 'Lovable sign up', url: 'https://lovable.dev' },
      { label: 'Lovable docs', url: 'https://docs.lovable.dev' },
      { label: 'G2 reviews', url: 'https://www.g2.com/products/lovable/reviews' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'warn',
        verdictLabel: 'GitHub-centric, no Google OAuth',
        keyline: 'GitHub is the primary login provider, which aligns with Lovable\'s developer audience but creates unnecessary friction for non-technical users, founders, or designers without a GitHub account.',
        bullets: [
          'GitHub OAuth — primary and most prominent path.',
          'Email + password available as a fallback.',
          'No Google, Microsoft, or Apple OAuth.',
          'No SAML SSO on standard plans.',
          'GitHub account creation itself adds a prerequisite step for non-dev users.'
        ]
      },
      'sign-up-friction': {
        verdict: 'warn',
        verdictLabel: 'GitHub dependency gates non-dev users',
        keyline: 'For developers, GitHub OAuth is fast. For anyone else, the lack of Google login is a real barrier — they must either create a GitHub account or use email/password. A meaningful subset of Lovable\'s stated audience (founders, designers) will feel this.',
        bullets: [
          'GitHub OAuth: ~5 seconds for existing GitHub users.',
          'Email/password path requires email verification.',
          'No Google, Apple, or Microsoft OAuth — reduces accessibility for non-developers.',
          'Free plan available with credit limits.',
          'No phone verification required.',
          'Tool positions itself as "for everyone" but auth choices say "for developers."'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'good',
        verdictLabel: 'AI-first onboarding — prompt to first output fast',
        keyline: 'Once past signup, Lovable\'s onboarding is strong. A single prompt field is the entire interface — users describe what they want to build and Lovable generates a working app. First output appears in under 2 minutes.',
        bullets: [
          'Blank prompt field with example prompts shown prominently.',
          'No configuration, no template picker, no wizard — just describe the app.',
          'First app generation completes in 60–120 seconds.',
          'Live preview shown alongside the generated code.',
          '"Remix" suggestions help users iterate without knowing exactly what to ask.',
          'No forced tutorial — the product teaches itself through use.'
        ]
      }
    }
  },

  {
    name: 'Perplexity',
    category: 'AI Research',
    pricing: 'Free / Pro / Enterprise',
    url: 'https://perplexity.ai',
    summary: 'AI search tool with very low signup friction. Google, Apple, and Microsoft OAuth all available. Post-signup drops directly to the search interface with no onboarding wizard — immediate utility, but no guidance for new users.',
    sources: [
      { label: 'Perplexity sign up', url: 'https://perplexity.ai' },
      { label: 'Perplexity Pro features', url: 'https://perplexity.ai/pro' },
      { label: 'Capterra reviews', url: 'https://www.capterra.com/p/perplexity-ai' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Google, Apple, Microsoft OAuth',
        keyline: 'Three major OAuth providers cover virtually all users. Email + password also available. No GitHub or Facebook login, but the coverage is strong for a consumer AI tool.',
        bullets: [
          'Google OAuth — available and prominent.',
          'Apple OAuth — available.',
          'Microsoft OAuth — available.',
          'Email + password as fallback.',
          'No GitHub, Facebook, or Slack OAuth.',
          'Enterprise SSO available on Enterprise plan.'
        ]
      },
      'sign-up-friction': {
        verdict: 'good',
        verdictLabel: 'Zero-configuration start',
        keyline: 'Google OAuth completes signup in 2 clicks. No survey, no workspace setup, no phone verification. Perplexity can also be used without an account for basic searches, reducing the urgency of signup.',
        bullets: [
          'Google OAuth: 2 clicks, then directly in the product.',
          'No role survey or use-case picker.',
          'No workspace naming or team setup.',
          'No credit card on Free.',
          'No phone verification.',
          'Anonymous use available for limited queries without an account.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'No onboarding — assumes users know what to do',
        keyline: 'After signup, users land on the search interface. No tour, no example prompts at first login, no explanation of features like Pro Search, Spaces, or Collections. Experienced AI users are fine; newcomers have to self-discover.',
        bullets: [
          'First view after login is the same search interface as anonymous users.',
          'No onboarding sequence, tooltip tour, or feature checklist.',
          'Spaces and Collections features are not surfaced at first login.',
          'Pro features are discoverable via the sidebar but not explained.',
          '"Discover" feed available but not introduced.',
          'Mobile app install not promoted at signup.'
        ]
      }
    }
  },

  {
    name: 'Claude',
    category: 'AI Assistant',
    pricing: 'Free / Pro / Team / Enterprise',
    url: 'https://claude.ai',
    summary: 'Anthropic\'s Claude.ai. Google and Apple OAuth, plus email. Enterprise SSO on Enterprise plan. Historically had waitlist friction; now generally available. Phone verification in some regions adds friction not seen in competitors.',
    sources: [
      { label: 'Claude.ai', url: 'https://claude.ai' },
      { label: 'Anthropic usage policy', url: 'https://www.anthropic.com/legal/usage-policy' },
      { label: 'Enterprise overview', url: 'https://www.anthropic.com/enterprise' }
    ],
    findings: {
      'auth-methods': {
        verdict: 'good',
        verdictLabel: 'Google + Apple + enterprise SSO',
        keyline: 'Google and Apple OAuth cover the major consumer platforms. Enterprise SAML SSO available. No Microsoft OAuth, which is a gap for Microsoft-heavy organizations not on Enterprise.',
        bullets: [
          'Google OAuth — available on all plans.',
          'Apple OAuth — available on all plans.',
          'Email + password supported.',
          'No Microsoft, GitHub, or Slack OAuth.',
          'Enterprise SAML SSO via Anthropic Enterprise plan.',
          '2FA available.'
        ]
      },
      'sign-up-friction': {
        verdict: 'warn',
        verdictLabel: 'Phone verification in some regions',
        keyline: 'For most users Google OAuth is fast. But Claude.ai requires phone number verification in several regions, which is unique among tools in this benchmark and creates friction that competitors don\'t impose.',
        bullets: [
          'Google OAuth is the fastest path for most users.',
          'Phone number verification required in some regions (US, EU, others vary).',
          'Phone verification is an unusual requirement — none of the other 11 tools require it.',
          'Historical waitlist for new users — now generally available.',
          'No credit card on Free plan.',
          'Email/password path requires email confirmation.'
        ]
      },
      'post-signup-onboarding': {
        verdict: 'warn',
        verdictLabel: 'Minimal onboarding — example prompts only',
        keyline: 'After signup, users land on the chat interface with a few example prompt suggestions. No wizard, no feature tour, no explanation of Projects or context windows. The product explains itself through use but offers little initial guidance.',
        bullets: [
          'Splash screen with 3–4 example prompt suggestions on first login.',
          'No interactive tutorial or feature checklist.',
          'Projects feature not surfaced prominently at first login.',
          'Artifacts, analysis, and vision features not introduced.',
          'Sidebar navigation is minimal — relies on user exploration.',
          'No team invite flow during onboarding for Team plan users.'
        ]
      }
    }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Creating topic…');
  const topic = await post('/api/topics', TOPIC);
  const tid = topic.id;
  console.log(`Topic created: ${tid}`);

  for (const tool of TOOLS) {
    process.stdout.write(`  Adding ${tool.name}… `);
    const { findings, ...appData } = tool;
    const app = await post(`/api/topics/${tid}/apps`, appData);
    await put(`/api/topics/${tid}/apps/${app.id}`, { findings });
    console.log(`done (${app.id})`);
  }

  console.log(`\n✅ Done — open http://localhost:3344/topic.html?id=${tid}`);
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
