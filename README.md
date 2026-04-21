# Sharing UX Benchmark

A research comparison of how 12 collaboration tools handle **sharing, permissions, and external-guest collaboration**.

**Tools covered:** Miro · FigJam · Lucidspark · Whimsical · tldraw · Stormboard · Notion · Evernote · Canva · Lovable · Perplexity · Claude.

## What's in this repo

```
.
├── index.html               # Visual gallery — screenshots + pain points + your own screenshots
├── artifact/
│   └── index.html           # Interactive dashboard — tool picker, comparison matrix, insights
├── stormboard-deep-dive/
│   └── Stormboard - sharing experience.html   # Original deep dive on Stormboard only
└── user-screenshots/
    ├── README.md            # How to add your own screenshots
    ├── stormboard/
    ├── miro/
    ├── figjam/
    ├── lucidspark/
    ├── whimsical/
    ├── tldraw/
    ├── notion/
    ├── evernote/
    ├── canva/
    ├── lovable/
    ├── perplexity/
    └── claude/
```

## How to use it

- **Visual gallery** (`index.html`): Per-tool sections with curated screenshots from vendor help centers, a "pain points" panel sourced from G2 / Reddit / community forums, and a "your screenshots" panel that auto-loads anything you drop in the matching `user-screenshots/<tool>/` folder.
- **Dashboard** (`artifact/index.html`): Click any of 12 tools to open a deep-dive with Permissions / Public link / Guest collaboration dimensions, each rated good/warn/bad. Switch to the comparison matrix for side-by-side, or the insights tab for cross-cutting patterns.

## Three dimensions compared

1. **Permissions model** — what roles exist, granularity, inheritance
2. **Public / anonymous link** — can someone access without an account, with what access level
3. **External & guest collaboration** — seat economics, caps, external-user UX

## Adding your own screenshots

See [`user-screenshots/README.md`](user-screenshots/README.md). Short version: drop files named `01.png`, `02.png`, … up to `20.ext` in the folder for that tool. PNG / JPG / JPEG / WEBP / GIF all work. Reload the gallery.

## Sources

Help-center articles, vendor blogs, and third-party tutorials — linked in full within each tool card of the dashboard and below every image in the gallery. Pain points are attributed to G2, Capterra, Reddit-adjacent threads, vendor community forums, and news coverage.

## License

Research content authored here is MIT-licensed. Screenshots embedded from vendor CDNs remain the property of their respective vendors — this repo references their public URLs rather than re-hosting.
