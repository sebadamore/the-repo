# Sharing UX Benchmark — Strategic Analysis Report

*Ember / Intent Design System · April 2026*

---

## Framing note

This report applies Ember's five foundational questions and competitive landscape framework to the Sharing UX Benchmark dataset: 12 collaboration tools evaluated across three dimensions (permissions model, public/anonymous link, external and guest collaboration), each rated good / warn / bad with detailed bullets. Where the evidence is thin or the inference is speculative, I say so directly.

---

## 1. Problem Validation

**Is "sharing UX complexity" a real problem, and how severe?**

We have strong evidence that the problem is real, but it is not uniformly distributed. The benchmark reveals three distinct failure modes, each affecting different users in different ways.

**Failure mode 1: The guest cliff.** Getting an external person into a document is often harder than it needs to be. Stormboard requires an email-invited account with no fallback — the only tool of 12 that won't let anyone access content without registering. Evernote's note-level sharing works fine, but notebook-level collaboration requires an Evernote account, fragmenting the experience based on a distinction most users don't care about. Whimsical caps guest counts per file (10 on Free, 200 on Enterprise) as a pricing mechanism, making the friction structural by design.

**Failure mode 2: Dangerous defaults.** The data surfaces a specific and serious issue: Notion lets a guest with Full Access remove the Workspace Owner from a page. Miro and Figma default to "Can edit" when creating public links on paid plans. These aren't edge cases — they're the path of least resistance. The severity rating here is high because the consequences are asymmetric: most users will never notice, but those who get burned lose data or control and don't always know why.

**Failure mode 3: Permission opacity.** Six of 12 tools separate "billing tier" from "permission level" — Stormboard, Lucidspark, Miro, Notion, Perplexity, and Claude all have distinct concepts of who can access something vs. who is paying for a seat. The UX surface doesn't always make this legible. When a Stormboard Guest requests Member status, they're crossing a billing boundary, not just a capability boundary. Users don't think in those terms.

**Severity rating: Moderate to high**, with hotspots. The problem isn't that sharing is universally broken — 10 of 12 tools support anonymous access via link, and the Google Docs mental model is well-established. The problem is that the edge cases (external guests, enterprise controls, permission inheritance) are where real friction concentrates, and that's where the highest-value collaboration often happens.

---

## 2. Audience Definition

The benchmark data points to at least four distinct user segments. Treating them as one audience explains why so many products get this wrong.

**Segment A: The Link Sender.** Solo users or small teams who share content occasionally and want minimum friction. Their mental model: copy URL, paste in Slack. They need "anyone with the link can view" to work with zero configuration. This segment is well-served by tldraw (URL is the permission), Miro on paid plans, Canva, and Perplexity's Thread sharing. Their pain: discovering that the link doesn't work the way they expected — it required the recipient to sign up, or it granted more access than intended.

**Segment B: The External Collaborator Manager.** Project leads at agencies, consultancies, or product teams who regularly bring clients or partners into documents without those people joining the organization. This is the segment most poorly served by the current landscape. Whimsical's hard guest caps penalize them directly. Stormboard's email-only flow adds unnecessary steps. Lovable has no free-guest tier at all. Lucidspark's Guest Collaborator link (Enterprise only) is the closest thing to a genuine solution, but it requires buying the top tier. Claude has no external-guest model at all.

**Segment C: The Enterprise Admin.** IT or security administrators who need to control what employees share externally. This segment is reasonably served: Figma and Miro both offer org-level kill switches for public links. Stormboard's conservative-by-default posture actually works in their favor here — there's no public sharing to disable because it doesn't exist. Their pain: audit trails and guest-permission visibility are underdeveloped across the board. The benchmark notes that Notion's admin audit of guest-granted permissions is "less surfaced than enterprise-grade tools."

**Segment D: The Accidental Sharer.** The user who doesn't think about permissions at all and shares in the way the UI makes easiest. This person is most at risk from dangerous defaults. They're the one who accidentally gives a Figma file edit access to "anyone with the link" because that was the default on their plan. Protecting this segment requires better defaults and friction at the moment of maximum risk, not better documentation.

These segments have contradictory needs. What Segment A wants (zero-friction sharing) is exactly what Segment C wants to prevent. This is the core tension the category has never fully resolved.

---

## 3. Solution Fit Analysis

**What patterns are genuinely working?**

The Google Docs pattern — three roles (View / Comment / Edit), toggleable public link, optional password — is the clearest winner across the benchmark. Miro, FigJam, Whimsical, Canva, and Notion all converge on it. It works because users already understand it from Google, it gives the Link Sender what they need, and it gives the Enterprise Admin an obvious thing to lock down. The pattern's weakness is that it flattens the billing/access distinction, which causes confusion when organizations try to manage external collaborators at scale.

The "URL is the permission" pattern (tldraw) genuinely solves for Segment A but not for anyone else. It's an honest trade. tldraw is transparent about this: the hosted app has near-zero permission surface, and enterprises are expected to self-host with their own auth layer. This is actually cleaner thinking than tools that bolt enterprise controls onto a consumer-first model.

The "published vs. shared" split in Lovable and Canva is the most interesting structural innovation in the set. Lovable exposes the running app at a public URL without leaking the source or editor rights. Canva separates the public-facing output from editor access. This pattern is correct for their category (builders and design tools), and there's an argument it should migrate to collaborative documents as a general primitive: the thing you share with the world vs. the thing you collaborate on internally are different objects with different permissions surfaces.

**What patterns are adding complexity?**

The billing-as-permission axis. When "Guest" means both "lower capability" and "free seat," the system forces users to think about billing when they're trying to accomplish a creative task. Stormboard's split (Member = paid, Guest = free) is the most explicit version, but Lucidspark, Whimsical, and Notion all have versions of this entanglement. It's not wrong to have a free-guest concept; it's wrong to surface that boundary at the moment of inviting a collaborator.

Hard per-file guest caps (Whimsical: 10 / 50 / 100 / 200) use friction as a monetization lever. This is a legitimate business decision, but it fails users who need to share a file with a large number of external reviewers without upgrading their plan.

**What does "right solution" look like here?**

The right solution separates three concerns that the current generation conflates: who can see something, what they can do with it, and what it costs. A user should be able to make a capability decision (can this person edit?) without simultaneously making a billing decision (are they a paid seat?). That separation is possible — Lucidspark's Guest Collaborator link hints at it — but no tool in this set does it cleanly across all tiers.

---

## 4. Feature Validation

### Table stakes (present in 10+ of 12 tools)

- "Anyone with the link" anonymous view access
- Three-role model (View / Comment / Edit or equivalent)
- Email-based explicit invite for named collaborators
- Org-level admin controls on at least one paid tier

### Differentiators (present in top-scoring tools only)

- Link expiry (Notion, Figma, Whimsical — and only them)
- Password protection on public links (Figma, Miro, Whimsical, Notion)
- Org-level kill switch for public sharing (Figma, Miro)
- Per-guest role selection rather than link-level permissions (Lucidspark Enterprise, Stormboard Enterprise)
- Published-vs-shared split as a first-class primitive (Lovable, Canva)
- No-account editing for external guests without consuming a seat (Lucidspark Enterprise only)

The concentration of differentiating features at Enterprise tiers is notable. Password protection and link expiry are on paid plans. No-account editing for guests is Enterprise-only at Lucidspark. This creates a market dynamic where the better sharing experience is locked behind the most expensive tier — the same users who most need frictionless external collaboration (agencies, consultancies, mixed-org teams) pay a premium for it.

### Present but rated warn/bad (mis-implemented)

- Guest collaboration in Notion: the footgun (Full Access guests can remove owners) undermines an otherwise strong permission model. The feature exists but the default is dangerous.
- Public link in Lucidspark: available but anonymous editing requires Enterprise, which breaks user expectations set by the feature's visibility.
- External guest model in Canva: described as "category-confused." The public-link flow works, but there's no dedicated Guest role surface, so external collaborators look and feel the same as internal ones. This creates confusion about who has access to what.
- External guest model in Perplexity: Space-scoped only. Thread sharing is clean, but bringing someone into a persistent collaborative space has a different and less obvious flow.

### Absent everywhere (opportunity gaps)

- **Audit trail for guest-granted permissions.** No tool in this set shows an admin a clear view of "who gave whom what access and when." Enterprise-grade tools gesture toward this but none make it the primary surface.
- **Revocable, time-limited guest access with automatic expiry.** Notion offers link expiry; no tool offers automatic access expiry when a project ends or a contract lapses. This is a genuine enterprise need.
- **Unified guest management across all files.** If an external collaborator has been invited to 30 different boards or pages, there's no single place to see or revoke all of that. Each tool manages guests at the file or page level.
- **Bridged external identity.** All 12 tools treat external guests as either (a) anonymous link-followers with no persistent identity or (b) registered users with full accounts. There's no middle option: a lightweight persistent identity for a guest who doesn't need a full account but whose access should be trackable and revocable. Slack Connect is the closest analogy in an adjacent category; it doesn't exist in this one.

---

## 5. Competitive Landscape

### Tool theses

| Tool | The bet they made on sharing UX |
|---|---|
| Miro | Google Docs model wins; make it flexible at enterprise scale |
| FigJam (Figma) | Inherit Figma's mature sharing infrastructure; open sessions for low-friction whiteboard moments |
| Lucidspark | Differentiate on the one thing nobody else does: no-account guest editing at enterprise scale |
| Whimsical | Sharing simplicity as a feature; accept the guest caps as a pricing-plan signal |
| tldraw | Radical openness; URL is the permission; trust the URL as a secret |
| Stormboard | Conservative enterprise default; no public links because enterprise IT doesn't want them |
| Notion | Most granular model in the category; accept the footgun risk in exchange for flexibility |
| Evernote | Note-level sharing is fine; notebook-level is an afterthought (the data shows this) |
| Canva | Consumer-first with publish/share separation; make it feel like Google Docs for designers |
| Lovable | Cleanest published-vs-shared split; no free-guest tier by design |
| Perplexity | Two primitives (Thread vs Space) with distinct sharing semantics for each |
| Claude | Org-scoped by default; no external-guest model because the product isn't designed for it yet |

### Positioning map

Two axes matter here.

**Open ↔ Locked-down** (how permissive the defaults are)  
**Simple ↔ Granular** (how many permission levers exist)

```
                    SIMPLE
                       |
    tldraw             |         Evernote
    Canva              |
                       |
OPEN ─────────────────────────────── LOCKED-DOWN
                       |
    Miro / Whimsical   |     Stormboard
    FigJam / Lovable   |
    Perplexity         |
          Notion       |     Claude
                       |
                  GRANULAR
```

The interesting observation: the granular-and-open quadrant is occupied by Miro, FigJam, Whimsical, and Lovable — the strongest overall performers in the benchmark. The granular-and-locked quadrant (Stormboard, Claude) serves a real enterprise need but sacrifices external collaboration. The simple-and-open quadrant (tldraw, Canva) wins on friction but concedes control.

The simple-and-locked quadrant is nearly empty. Evernote sits there by default. No one is making a strategic bet on "simple but conservative" as a product position — which might be an opportunity for a tool targeting regulated industries that don't need complex permissions but can't have public links.

### White space

Three areas are genuinely unoccupied:

1. **Lightweight persistent guest identity.** Not anonymous, not a full account, but a trackable persistent identity for external collaborators. The technology exists (magic links, OAuth with limited scope) but no collaboration tool has made it a first-class primitive.

2. **Cross-file guest management.** Every tool manages guests per-document. No tool offers a guest directory: here are all the external people with access to anything in your organization, with a single revoke button. This is table stakes for security teams but doesn't exist.

3. **Graduated external access.** Today the options are binary: link-follower (anonymous, no persistence) or invited member (full account, persistent). A "trusted external" tier — someone who doesn't join your org but whose access is bounded, logged, and revocable — doesn't exist in this category. It exists in adjacent categories (Slack Connect, Microsoft B2B collaboration).

### Switching cost analysis

Users stay despite sharing friction for reasons that have nothing to do with sharing UX:

- **Workflow integration.** Notion's database features, Miro's facilitation templates, Figma's design system infrastructure — these create switching costs that sharing UX cannot overcome.
- **Organizational momentum.** When a whole company is on Miro, the friction of external sharing matters less than the friction of moving 10,000 boards.
- **Content gravity.** Years of notes in Evernote, boards in Miro, or designs in Figma are sticky. Sharing UX is almost never the reason someone moves.

This matters for opportunity sizing: fixing sharing UX is unlikely to drive acquisition or retention on its own unless the core workflow value proposition is comparable. A new entrant competing on sharing UX alone will not win.

---

## 6. Strategic Synthesis

### Insight 1
**Observation:** The benchmark records only one tool — Lucidspark — that lets an external, non-account user edit content without consuming a paid seat, and it's Enterprise-only.  
**Inference:** The market has decided to monetize external collaboration through seat economics, which means the users who most need frictionless external access (agencies, freelancers, mixed-org teams) pay the highest premium for it.  
**Implication:** A tool that makes no-account guest editing available on lower tiers would be meaningfully differentiated, not just incrementally better. This is a structural gap, not a UX gap.  
**Evidence strength: Strong.** The pattern is consistent across all 12 tools; there are no counter-examples.

### Insight 2
**Observation:** Dangerous defaults appear in Notion (Full Access guest footgun) and Miro/Figma (default-to-edit on public links). Both are top-rated tools that also have the most sophisticated users.  
**Inference:** Permission complexity and dangerous defaults are correlated — the more granular the model, the more ways the user can misconfigure it.  
**Implication:** The safe path is not more granularity but better default-setting UX: making the safe choice the obvious one at the moment of sharing, not buried in a settings screen.  
**Evidence strength: Moderate.** The correlation is visible in two of the top three tools; we'd need user research to confirm causation.

### Insight 3
**Observation:** The "published vs. shared" split (Lovable, Canva) is conceptually cleaner than the traditional single-sharing-dialog model, but it's only present in builder and design tools, not in collaborative documents or whiteboards.  
**Inference:** Whiteboards and docs haven't adopted this split because their output is the same artifact as the collaboration surface — there's no separate "published app" to point to.  
**Implication:** For any tool that starts producing a distinct output (a rendered report, a published page, a deployed feature), the published/shared split becomes viable and should be designed in from the start.  
**Evidence strength: Moderate.** The pattern is clear; the inference about why it hasn't migrated is speculative.

### Insight 4
**Observation:** AI tools (Claude, Perplexity) are the weakest category on external and guest collaboration. Claude has no external-guest model; Perplexity's is Space-scoped only.  
**Inference:** AI collaboration tools were built for single-user or same-org workflows. External collaboration was not in the initial product thesis.  
**Implication:** As AI tools move toward team-first or multi-org workflows, they will need to retrofit external sharing models that whiteboard and doc tools have already worked out. They should borrow the patterns that are working (Guest Collaborator link model, published/shared split) rather than invent new ones.  
**Evidence strength: Strong.** The data directly supports this; both AI tools score bad or warn on external collaboration.

### Insight 5
**Observation:** No tool in this set offers unified guest management across all documents — a single view of every external person with access to anything in an organization.  
**Inference:** Tools are optimized for the moment of sharing, not for ongoing access governance.  
**Implication:** For organizations that take security seriously, this is a latent compliance risk. A tool that ships cross-file guest management as a core admin feature (not an enterprise add-on) would be meaningfully differentiated in regulated industries.  
**Evidence strength: Strong as an observation, moderate as an opportunity.** The gap is clear; whether organizations would pay for it depends on primary research.

---

## 7. Testable Hypotheses

**Hypothesis 1: Guest caps are a meaningful friction point for agencies and consultancies, not for the rest of the market.**  
Whimsical's hard per-file caps and Lovable's absence of a free-guest tier would only matter to users who regularly collaborate with large numbers of external people. For most users — solo creators, internal teams — this constraint is invisible. Primary research method: segment analysis of support tickets and churn data at tools with hard guest caps, filtered by company type.

**Hypothesis 2: Dangerous defaults cause more actual harm than users report, because most users don't know when they've misconfigured permissions.**  
The Notion footgun and Miro's default-to-edit on public links are only harmful if a user doesn't notice. Most users who've accidentally over-shared don't discover it. This means the problem is underreported in qualitative research. Primary research method: diary study or permission audit of shared link settings in a sample of real organizations.

**Hypothesis 3: The "lightweight persistent guest identity" feature would reduce guest management overhead enough to be worth building, but only for organizations above a certain collaboration-intensity threshold.**  
This is a weak signal in the benchmark data — the gap is visible, but whether users want it depends on how often they have the same external collaborators over time. Primary research method: interviews with project managers at agencies and consultancies who manage recurring client access.

---

## 8. Opportunity Sizing

**Where is the biggest gap between user need and market delivery?**

The clearest gap is external collaboration for non-enterprise buyers. The story the data tells:

- The users who most need frictionless external collaboration (agencies, freelancers, small studios, mixed-org project teams) are on Free or Pro plans.
- The features that solve their problem (no-account guest editing, unlimited guests, per-guest role control) are locked behind Enterprise plans at every tool in the set.
- The only tool that gets close — Lucidspark's Guest Collaborator link — requires Enterprise, pricing out the buyers who would benefit most.

This is not a niche. Freelancers, agencies, and mixed-org project teams represent a large share of the addressable market for collaboration tools. The current pricing structure means they either live with the friction or pay for Enterprise to get around it. Neither outcome is good for users.

A tool that offers no-account guest editing with per-guest role control on a mid-tier plan would be positioned to take meaningful share from this segment. The technical problem is not hard — Lucidspark has already solved it. The business model question is whether the economics work without the Enterprise uplift, and that requires primary research on willingness to pay.

The second-largest gap is access governance tooling: unified guest management, automatic access expiry, audit trails. This is a regulatory and security story, not a collaboration-friction story. It addresses a different buyer (IT and security leads, not project managers) and a different budget (compliance spend, not productivity spend). The gap is real, but pursuing it means competing with IAM tooling, not collaboration tools — a harder positioning problem.

The third gap — bridged external identity — is genuine but early. No buyer is asking for it by name because they've never seen it. This is a "show, don't tell" opportunity: the right prototype would make the need obvious. As a standalone feature it is weak; as part of a broader external collaboration story it could be the differentiating detail that makes the pitch land.

---

*Confidence note: All findings are derived from the benchmark dataset, which reflects the tools' documented behavior as of the research date. Pricing tiers and feature availability in SaaS products change frequently. High-confidence structural observations (no tool offers cross-file guest management; only one tool offers no-account editing at non-Enterprise tiers) are likely durable. Tier-specific feature availability should be re-verified before any product or go-to-market decision.*
