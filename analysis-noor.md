# UX Pattern Inventory — Sharing UX Benchmark
**Analyst:** Noor (Intent design system, entry point / UX orientation)
**Mode:** Extract
**Date:** 2026-04-22
**Evidence source:** Benchmark TOOLS array, 12 tools, 36 data points (3 dimensions × 12 tools), plus cross-cutting insights embedded in the dashboard.

---

## 1. Context summary

These are collaborative creation tools — things you build or think in together, as opposed to file storage or communication apps. The 12 span five sub-categories:

- **Whiteboards** (Stormboard, Miro, FigJam, Lucidspark, Whimsical, tldraw): spatial canvases, real-time presence, typically board-scoped sharing.
- **Docs & notes** (Notion, Evernote): text-primary, hierarchical. Sharing unit varies between a page, a notebook, and a workspace.
- **Design** (Canva): design output plus collaborative editing, unusually consumer-facing for this category.
- **AI builders** (Lovable): project-based; clear separation between "the app you ship" and "the codebase you edit."
- **AI assistants** (Perplexity, Claude): conversation-primary. Sharing is ephemeral (a thread) or org-scoped (a space/project).

"Sharing" in this context means at least three different things depending on who's asking: a teammate adding someone to a project, a designer sending a read-only link to a client, and an admin locking down who can export anything. All three get tangled into the same UI surface in most tools.

Users range from individual creators to enterprise teams. The benchmark does not track B2C vs. B2B skew per tool, which matters for interpreting some of the "warn" verdicts — what looks like a weak guest model for Evernote may be intentional if 90% of their active users are solo note-takers.

---

## 2. Patterns in use

### 2.1 Role models

**3-role canonical stack (Viewer / Commenter / Editor)**
Used by: Miro, FigJam, Whimsical, Canva, Perplexity (Spaces), Claude (simplified).
This is the de-facto standard. Commenter sits between view and edit — you can react to work without changing it. The pattern comes from Google Docs and has calcified into an expectation.

**4-role extended stack (adds Full Access or Edit+Share)**
Used by: Notion (Full access / Can edit / Can comment / Can view), Lucidspark (View / Comment / Edit / Edit+Share), Lovable (Viewer / Editor / Admin / Owner).
The fourth level either extends trust downward (Notion's Full access, which includes re-sharing rights) or upward (Lovable's Owner, the only one who can delete the project). Both create a more intentional privilege ladder.

**Dual-axis licensing model (paid seat × permission role)**
Used by: Stormboard (Member vs. Guest × Administrator / Contributor / Viewer), Lucidspark (licensed user vs. guest collaborator × edit level), Miro (team member vs. Visitor × board role).
These tools separate "does this person cost a seat?" from "what can they do?" Most simpler tools collapse both axes into one role picker, which hides the billing implication.

**No formal role model**
tldraw: URL possession is the permission. Everyone co-edits. Works for the tool's use case; scales poorly to anything requiring audit or trust boundaries.

### 2.2 Public / anonymous link patterns

**"Anyone with the link" toggle**
10 of 12 tools offer this. Standard UI is a toggle that flips a board/page/project from private to link-accessible. Typically you then pick a permission level for link followers (view, comment, or edit). Miro, FigJam, Notion, Whimsical, Lucidspark, Canva all follow this model.

**URL as native primitive (no toggle needed)**
tldraw: no "share" dialog at all. The URL is the room ID. Sharing = copying the URL. Fastest to act on; zero friction; zero control.

**Per-thread / per-item toggle**
Perplexity: Threads are private by default; a "Sharable" toggle on each thread generates a viewable link. This is the most atomic version of the pattern — you decide per conversation, not per workspace.

**Password protection**
Figma, Notion, Whimsical. Relatively rare in the category. Password + link means someone needs both to enter. Useful for client deliverables and anything you don't want indexed.

**Link expiry**
Notion ships link expiry, making it the only tool in this set to address the "I forgot I shared that" problem by default. Figma offers it at enterprise tier.

**Admin kill-switch (org-wide disable)**
Figma, Miro. The organization admin can flip a switch and prevent any member from enabling public link sharing. This is the enterprise safety net — it means the sharing model is opt-in at the org level, not opt-out.

**"Published" vs. "shared" split**
Lovable and Canva separate publishing an output (a live app URL, a design template) from sharing the source editor. This is architecturally honest: viewing the thing you made is not the same as getting edit access to how you made it.

### 2.3 Guest / external collaboration patterns

**Visitors (no-account link followers)**
Miro: Visitors follow a public link without creating an account. They get a cursor and the permission level the link was set to. Whimsical's anonymous-edit toggle is similar. Canva allows anonymous editing with no account. tldraw is all-visitors by design.

**Email-invited Guests (free seat tier)**
Stormboard, Notion, Evernote: external users are invited by email, create an account, and occupy a Guest role that doesn't use a paid license. They can collaborate but within restrictions. Per-guest role assignment is available in Stormboard Enterprise and Lucidspark.

**Guest Collaborator link (edit-capable, no account)**
Lucidspark Enterprise: the most generous pattern in the set. A special link lets someone edit a board without a Lucid account and without consuming a paid seat. No other tool in this benchmark matches this combination.

**No guest model**
Claude: external collaboration = sending someone a private chat link out-of-band. No formal guest role, no guest seat tier. The architecture is explicitly org-bound.

**Hard guest caps as a pricing signal**
Whimsical: 10 guests per file on Free, 50 on Pro, 100 on Business, 200 on Enterprise. The cap doesn't reflect a technical limit — it's a conversion lever. Each upgrade unlocks more external reach.

---

## 3. What is working

**Miro's layered permission architecture.** Three roles × board vs. team vs. company defaults × Visitor pathway × admin kill-switch. Every layer is independently configurable and each serves a distinct use case. The result is a model that a solo user can ignore entirely (it works fine with defaults) and an enterprise admin can tune precisely. That's hard to get right.

**Figma's scope-then-role ordering.** Before you set a role (view/edit), you set an audience (anyone, your org, your team, people invited). Audience narrows the pool; role sets the capability within that pool. This two-step framing reduces the risk of accidentally making something public when you only meant to share it with your org. Other tools conflate these into a single dropdown.

**Lucidspark's Guest Collaborator link.** Free-to-collaborate, no-account-required editing is genuinely rare. Conceptually this is the right move for external stakeholders who just need to vote on sticky notes or add a comment. The constraint (Enterprise only) is disappointing from a UX standpoint but it at least exists somewhere in the product.

**Lovable's published/editor split.** The distinction between "your app is live at this URL" and "these collaborators can edit the project" is clean and correct. It avoids the classic confusion where sharing a Figma design link accidentally grants edit access. The role ladder (Viewer / Editor / Admin / Owner) is also well documented.

**Notion's link expiry.** Nobody else in this benchmark ships this by default. The mental model is right: a link you share has a natural life, and forgetting to revoke it is a real failure mode. Expiry is the opt-out, not the opt-in.

**Perplexity's Thread/Space duality.** Two primitives with clear intent: Thread is ephemeral and link-shareable; Space is persistent and role-governed. This maps well to two genuinely different use cases (show your work vs. coordinate ongoing research). Not every tool makes this distinction explicit.

---

## 4. What is failing

**Notion's Full Access footgun.** A Guest granted Full Access can remove the Workspace Owner from a page. This is documented in the benchmark and presumably in Notion's help docs, but that doesn't make it a safe default. Most users granting "Full Access" expect it to mean "can do everything I can do" — not "can lock me out." This is a trust boundary violation that the UI does nothing to warn against at the point of invite.

**Evernote's note/notebook asymmetry.** Notes get public URLs; notebooks don't. If you want to share a body of work, you either share notes one at a time or invite people to a notebook where they need an Evernote account. There's no coherent model here — it looks like two different sharing systems that were never reconciled. Users who need to share a collection of notes hit a wall with no obvious workaround.

**Whimsical's guest caps as a blunt pricing lever.** Capping external collaborators at 10 on the free tier is acceptable if the cap reflected something real (performance, storage, sync overhead). It doesn't — it's a conversion lever. The UX failure is that you can start a collaboration workflow with external partners and then discover mid-project that you've hit the cap. There's no graceful degradation — you upgrade or you kick people out.

**Stormboard's total absence of public links.** All external access requires email-invited Guest accounts. This is a coherent security posture for enterprise customers. But it means there's no lightweight "show this to someone without making them sign up" flow. A consultant who wants to show a Stormboard to a client has to make that client create an account. Most tools in the category solved this years ago.

**Claude's lack of any external guest surface.** If you're an org using Claude for team projects, you cannot invite a contractor, a client, or a reviewer without them being an org member. Sending a private chat link out-of-band is not a guest model — it's an escape hatch. The tool is explicitly org-bound, but that's a design choice that creates real friction the moment collaboration crosses an org boundary.

**Default permission levels on paid plans.** Miro and Figma default to "Can edit" when creating public links on paid plans. Most users who share a link to show someone work probably don't intend to hand them edit rights. The direction of the default is backward — view should be the default, edit should require a deliberate choice.

---

## 5. Anti-pattern flags

### AP-1: Dangerous Default Permission Level
**Tools:** Miro, FigJam (on paid plans, defaults to "Can edit" on public links)
**Severity:** High
**Category:** Default manipulation / dark default

When a user creates a public link, the default access level should be the most conservative option that still makes the link useful. "Can edit" is not that. Most sharing intents at the point of creating a link are "show someone this thing" — not "let anyone who finds this URL modify it." Defaulting to edit access is a choice that benefits the tool's "look how collaborative we are" positioning while creating real risk for users who don't notice or understand the dropdown. The fix is simple: default to "Can view," make edit access a deliberate upgrade.

Evidence strength: stated in the benchmark data. Cannot verify whether a warning is shown at the moment of creation from benchmark data alone, so severity could be lower if there's clear friction at that step.

### AP-2: Capability Without Warning — Notion Full Access
**Tools:** Notion
**Severity:** High
**Category:** Trust boundary violation / capability surprise

Full Access is advertised as the highest trust level you can grant. What isn't surfaced at the point of granting it is that Full Access guests can remove the Workspace Owner from a page. This non-obvious capability inverts the expected trust hierarchy — the person granting access loses control to the person being granted access. There's no warning in the share dialog, no confirmation step, no signal that you're about to make yourself vulnerable.

This is not deceptive in the manipulative sense — there's no evidence Notion benefits from this behavior. It's a design oversight with high consequence.

Evidence strength: stated explicitly in the benchmark. Whether Notion has since added mitigations is not captured here.

### AP-3: Guest Cap as Conversion Lever Without Graceful Degradation
**Tools:** Whimsical
**Severity:** Medium
**Category:** Artificial constraint / pricing pressure

Capping guests per file at 10/50/100/200 across pricing tiers is a legitimate monetization mechanism. The anti-pattern is that the cap doesn't come with graceful degradation. When you hit the cap, collaborators can't join. There's no "read-only" fallback, no warning before you invite the limit-breaking guest, no queue. The user is mid-workflow when they hit the wall.

Evidence strength: moderate. Cap policy confirmed; degradation behavior inferred.

### AP-4: Account Requirement as Participation Barrier
**Tools:** Stormboard, Claude, Evernote (for notebooks)
**Severity:** Low-Medium (context-dependent)
**Category:** Participation barrier / unnecessary friction

Requiring an account to view or contribute to something a collaborator explicitly shared with you makes sense for security-sensitive contexts. For most collaboration scenarios, it converts your friction into their growth metric. The invited person has to sign up for a service they didn't choose, often just to view one document. Context determines whether this is a design failure or a product positioning choice — enterprise tools targeting enterprise buyers are harder to criticize here.

Evidence strength: confirmed from benchmark data.

### AP-5: Billing Consequence Invisible at Share Point
**Tools:** Multiple (Miro, Lucidspark, Stormboard)
**Severity:** Medium
**Category:** Hidden consequence / surprise billing signal

The dual-axis models (paid seat × permission) are architecturally correct but the billing implications aren't surfaced where they matter: at the point of invite. If inviting someone as an Editor silently converts them into a paid seat holder, the person creating the invite should see that before they click confirm. The benchmark identifies that Lucidspark has "licensing impact depending on permission level granted" — whether that's shown in the UI at invite time is unclear.

Evidence strength: low-moderate. The billing consequence is documented; whether it's surfaced in the UX is not captured in the benchmark data.

---

## 6. What is missing

**Revoke-by-person on public links.** All tools that support public links share a single link per resource. If you shared a board link with five people and one of them leaves, your only option is to regenerate the link (which breaks it for the other four) or accept that the departed person still has access. A token-per-recipient model would address this. Nobody in this set does it.

**Contextual permission explanation at the point of sharing.** When you pick "Can edit" from a dropdown, no tool explains what that means in context — what can they delete? Can they invite others? Can they see billing? The permissions model lives in help docs. It doesn't exist where the user is making the decision.

**Expiry as a default, not an option.** Notion has expiry. Everyone else doesn't. The expected behavior for "I shared a link for a client review" is that the link eventually becomes inactive. Making expiry something you opt into means most shared links live indefinitely, which is not what most users would choose if asked.

**Audit trail for external access.** Which guests accessed the resource? When? Did they make changes? Only enterprise tiers of some tools offer anything here. For professional or sensitive use, the absence of access logs for external collaborators is a meaningful gap.

**Progressive disclosure on the permissions model.** None of the tools have a built-in "explain this to me" affordance in the sharing dialog. A tooltip explaining what "Full Access" means, right there in the dialog, would prevent the Notion footgun. Nobody has done this well.

**Graceful degradation on plan limits.** What happens when a user tries to share in a way their plan doesn't support? Most tools error or silently fail. The right pattern is a staged upgrade offer with a clear explanation of what's being unlocked and why the limit exists.

---

## 7. Ethical stance assessment

**On user autonomy:** Most tools default toward openness, which is pro-sharing but not always pro-user. Defaulting public links to "Can edit" (Miro, Figma) prioritizes the product's collaborative positioning over the user's likely intent. Users who don't know what they're doing share more broadly than they intend to. The correct default respects the least-access principle and asks users to opt into greater access.

**On transparent capability:** The Notion Full Access footgun is the sharpest example of a capability existing without being communicated where it matters. Users are not informed at decision time. This isn't deceptive in the traditional sense, but it is a failure of responsible disclosure within the product's own interface.

**On seat economics and incentive alignment:** The billing consequences of inviting external collaborators are often invisible at the point of action. Tools that benefit financially from converting guests to paid seats have an incentive to not make this obvious. The benchmark doesn't provide enough evidence to determine whether this is deliberate in any tool, but the pattern of opaque billing at invite time is common enough to flag as a structural concern.

**On guest caps as user-manipulative pricing:** Whimsical's hard guest caps are the clearest case of a technical UX decision that is actually a business decision in disguise. There's nothing wrong with monetizing collaboration scale. But the implementation creates a bad experience (mid-workflow failure) that is within the product team's control to fix. The choice not to fix it suggests the pain is considered acceptable collateral for the conversion pressure it creates.

**On vulnerable users:** None of the tools address differential risk for users sharing sensitive content. A therapist sharing Notion notes with a client has the same default experience as a designer sharing a mood board. No tool in this set offers a "sensitive content" mode or any signal that some sharing contexts carry higher stakes. This is a category-wide gap.

**On external parties:** The tools that require accounts (Stormboard, Claude, Evernote for notebooks) create asymmetric burden. The person being invited has to sign up for a service they didn't choose. This is a common industry practice worth naming: it converts collaboration friction into growth metrics.

---

## 8. Routing recommendation for Ember

The data shows a category that has mostly solved the basic mechanics of sharing (link generation, role pickers, guest invites) but has not solved the judgment layer: what should the defaults be, what are the real-world consequences of each option, and how do you make those consequences visible at the moment of decision?

Ember's strategic analysis should prioritize these four questions:

**Default permission architecture.** The most consequential design decision a sharing UX makes is what happens when a user clicks "share" without reading anything. Most tools get this wrong by defaulting too permissively. A product that defaults to view-only, explains the upgrade to edit in plain language, and requires a deliberate step to grant higher access would stand out.

**The external guest model gap.** Only one tool (Lucidspark Enterprise) offers no-account, no-seat, full-edit access for external collaborators. That's a wide gap. The category has converged on either "create an account" or "get a link" with no middle ground. A guest model lightweight enough to avoid friction but structured enough to allow revocation and audit would address a real unmet need.

**Expiry and revocation as first-class citizens.** Notion's link expiry is directionally correct but isolated. A product built around the idea that sharing is a temporary permission grant — not a permanent state — would reflect how collaboration actually works. Work has phases. Access should expire with them.

**Making the trust model legible at decision time.** Notion's Full Access footgun is solvable with a single confirmation dialog. The broader issue is that no tool makes the privilege model legible at the point of action. An interface that explains, in plain language, what you're about to share and what the recipient will be able to do — without sending you to a help article — would be novel in this category.

Ember should not focus on the basic role picker or the link-toggle mechanics. Those are solved. The opportunity is in the layer above: what does informed sharing look like, and how do you build a product where users share deliberately rather than by accident?

---

**Evidence notes:**
- All data sourced from the benchmark TOOLS array (12 tools, primary source). Some specifics (exact UI behavior, billing confirmation dialogs) are inferred from keylines and bullets rather than directly verified against live products.
- Anti-pattern severity ratings reflect the data available. Where the benchmark notes a policy but doesn't capture the full UI context, severity is marked as conditional.
- Category observations (e.g., "nobody does revoke-by-person") are based solely on this 12-tool set. Other tools outside the benchmark may have addressed these gaps.
