/**
 * migrate-2x.js
 *
 * Run once to:
 * 1. Create data/tools.json — the first-class tool registry
 * 2. Create data/topic-sharing.json — ports artifact/index.html into the standard topic format
 * 3. Update data/topics.json — removes the builtInUrl special case for sharing
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

function safeId(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

// ─── 1. TOOLS REGISTRY ───────────────────────────────────────────────────────
// Sourced from sign-up topic (canonical metadata) + artifact (URLs/descriptions
// that differ slightly — sharing benchmark had more detail on categories).

const TOOLS = [
  {
    id: 'stormboard',
    name: 'Stormboard',
    category: 'Whiteboard',
    pricing: 'Free / Business / Enterprise',
    url: 'https://stormboard.com',
    summary: 'Data-first digital whiteboard. Conservative auth posture: email + password only on standard plans, SAML SSO gated to Enterprise. No OAuth providers for individual users.'
  },
  {
    id: 'miro',
    name: 'Miro',
    category: 'Whiteboard',
    pricing: 'Free / Starter / Business / Enterprise',
    url: 'https://miro.com',
    summary: 'Category leader with broad OAuth coverage, a fast signup path, and one of the most polished onboarding flows in the whiteboard space — including an interactive demo board.'
  },
  {
    id: 'figjam',
    name: 'FigJam (Figma)',
    category: 'Whiteboard',
    pricing: 'Free / Pro / Org / Enterprise',
    url: 'https://figma.com/figjam',
    summary: "Inherits Figma's mature auth stack: Google, GitHub, and SSO. Signup includes a role survey and team setup before reaching the canvas, which adds steps but also personalises the experience."
  },
  {
    id: 'lucidspark',
    name: 'Lucidspark',
    category: 'Whiteboard',
    pricing: 'Free / Individual / Team / Enterprise',
    url: 'https://lucidspark.com',
    summary: "Part of the Lucid suite. Google and Microsoft OAuth on all plans. Sign-up is straightforward, and the template-first onboarding is a strength — though workspace configuration adds extra steps."
  },
  {
    id: 'whimsical',
    name: 'Whimsical',
    category: 'Whiteboard',
    pricing: 'Free / Pro / Business / Enterprise',
    url: 'https://whimsical.com',
    summary: 'Minimalist tool with a clean, low-friction signup. Google and Microsoft OAuth. Post-signup experience is lean — drops to workspace with minimal hand-holding.'
  },
  {
    id: 'tldraw',
    name: 'tldraw',
    category: 'Whiteboard',
    pricing: 'Free web app / SDK',
    url: 'https://tldraw.com',
    summary: 'Open-source canvas that requires no account to use. GitHub OAuth for account features. The zero-friction anonymous start is unmatched in the category.'
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Docs & notes',
    pricing: 'Free / Plus / Business / Enterprise',
    url: 'https://notion.so',
    summary: 'Sets the bar for post-signup onboarding in the productivity category. Magic link login, Google and Apple OAuth, and a use-case wizard that personalises the workspace before first use.'
  },
  {
    id: 'evernote',
    name: 'Evernote',
    category: 'Docs & notes',
    pricing: 'Free / Personal / Professional / Teams',
    url: 'https://evernote.com',
    summary: 'Veteran note-taking app with Google and Apple OAuth. The signup is functional but dated, and the post-signup experience pushes users toward paid plans early.'
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'Design',
    pricing: 'Free / Pro / Teams / Enterprise',
    url: 'https://canva.com',
    summary: "The broadest OAuth coverage in this benchmark. Canva's signup is fast, the use-case picker is smart, and the path from account to designing something is the shortest in the category."
  },
  {
    id: 'lovable',
    name: 'Lovable',
    category: 'AI Builder',
    pricing: 'Free / Pro / Business / Enterprise',
    url: 'https://lovable.dev',
    summary: 'AI-powered app builder. GitHub OAuth is the primary auth path, which creates a structural barrier for non-developer users. Once past signup, the prompt-driven onboarding is fast.'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'AI Research',
    pricing: 'Free / Pro / Enterprise',
    url: 'https://perplexity.ai',
    summary: 'AI search tool with very low signup friction. Google, Apple, and Microsoft OAuth all available. Post-signup drops directly to the search interface with no onboarding wizard.'
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'AI Assistant',
    pricing: 'Free / Pro / Team / Enterprise',
    url: 'https://claude.ai',
    summary: "Anthropic's Claude.ai. Google and Apple OAuth, plus email. Enterprise SSO on Enterprise plan. Phone verification in some regions adds friction not seen in competitors."
  }
];

const toolsPath = path.join(DATA, 'tools.json');
if (fs.existsSync(toolsPath)) {
  console.log('tools.json already exists — skipping tool registry creation');
} else {
  fs.writeFileSync(toolsPath, JSON.stringify(TOOLS, null, 2));
  console.log(`✓ Created data/tools.json with ${TOOLS.length} tools`);
}

// ─── 2. SHARING TOPIC ────────────────────────────────────────────────────────
// Port the artifact/index.html TOOLS array into the standard topic format.
// Dimensions: permissions, publicLink, externalGuest

const SHARING_DIMS = [
  { id: 'permissions',    name: 'Permissions model' },
  { id: 'public-link',    name: 'Public / anonymous link' },
  { id: 'external-guest', name: 'External & guest collaboration' }
];

// Verbatim findings from artifact/index.html
const SHARING_APPS_RAW = [
  { id: 'stormboard', name: 'Stormboard', cat: 'Whiteboard', pricing: 'Free / Business / Enterprise', url: 'https://stormboard.com',
    summary: 'Data-first digital whiteboard. Conservative sharing posture: no public URLs, email-only invites, strict Member / Guest license separation.',
    permissions:    { verdict: 'warn', verdictLabel: 'Split role model', keyline: 'Two axes: Team role (Member = paid seat, Guest = free) × Storm role (Administrator, Contributor, Viewer, Guest Contributor).', bullets: ['Storm Administrator has full edit + invite rights within a Storm.','Members occupy a paid license; Guests don\'t.','Enterprise only: Guest Contributor can use a \'Guest Pass\' — contribute in one Storm at a time.','Member Invitation Privilege (per-user setting) gates who can promote invitees to Member status.'] },
    publicLink:     { verdict: 'bad',  verdictLabel: 'No true public link', keyline: 'Stormboard does not publish anonymous / \'anyone with the link\' URLs. All external access goes through an email-invited Guest account.', bullets: ['Share options are: invite link (for team members), Storm ID + Key, or email.','Invited Guests must create a Stormboard account to enter.','Invite link can be refreshed — old links stop working immediately.'] },
    externalGuest:  { verdict: 'warn', verdictLabel: 'Guests via email only', keyline: 'External users are invited by email; they become Guests who don\'t take a paid seat. Contribution requires Enterprise.', bullets: ['Business plan: Guests limited to Viewer; max 10 Guests per Storm.','Enterprise: no Guest limit; Guest Contributors can activate Guest Pass in one Storm at a time.','Guests can request to become a Member — triggers admin approval.','Guests can\'t create Storms, manage users, generate reports, or access Substorms.'] },
    sources: [{ label: 'Share / invite a Storm', url: 'https://help.stormboard.com/en/articles/436503-how-do-i-share-invite-people-to-a-storm' },{ label: 'External collaborators', url: 'https://help.stormboard.com/en/articles/11455837-can-i-have-external-collaborators' },{ label: 'What is a Guest?', url: 'https://help.stormboard.com/en/articles/11492871-what-is-a-guest' },{ label: 'Guest Contributors launch', url: 'https://stormboard.com/blog/product-launch-guest-users' }] },
  { id: 'miro', name: 'Miro', cat: 'Whiteboard', pricing: 'Free / Starter / Business / Enterprise', url: 'https://miro.com',
    summary: 'Category leader. Mature, familiar Google-Docs-style sharing. 3 roles, anonymous public links, Visitors that don\'t need an account.',
    permissions:    { verdict: 'good', verdictLabel: 'Clean 3-role model', keyline: 'Editor / Commenter / Viewer — applied per-board or set as default for team and company.', bullets: ['Editor: full canvas edit, upload, delete.','Commenter: view + comment.','Viewer: read-only.','\'Default sharing settings\' let admins pre-configure the access every new board inherits.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'Anyone with the link, multiple levels', keyline: 'Toggle \'Anyone with the link\' → pick Can view / Can comment / Can edit. Password protection optional.', bullets: ['Public-link comment/edit is paid-plan-only; Free plan caps at view.','Visitors follow the link with no Miro registration required.','Enterprise admins can disable public sharing org-wide via Sharing Policy.'] },
    externalGuest:  { verdict: 'good', verdictLabel: 'Visitors + external team-mates', keyline: 'Two pathways: Visitors (link-based, no account) and \'sharing with users outside your team\' (explicit external collaborators).', bullets: ['Visitors via public link are effectively unlimited on paid plans.','External sharing setting controls whether members can invite non-team emails.','Board Admin role can gate who edits the sharing settings themselves.'] },
    sources: [{ label: 'Board access rights', url: 'https://help.miro.com/hc/en-us/articles/360017572194-Board-access-rights' },{ label: 'Sharing boards & inviting', url: 'https://help.miro.com/hc/en-us/articles/360017730813-Sharing-boards-and-inviting-collaborators' },{ label: 'Collaboration with Visitors', url: 'https://help.miro.com/hc/en-us/articles/360012524559-Collaboration-with-Visitors' },{ label: 'Enterprise sharing policy', url: 'https://help.miro.com/hc/en-us/articles/360017730133-Sharing-policy-on-Enterprise-Plan' }] },
  { id: 'figjam', name: 'FigJam (Figma)', cat: 'Whiteboard', pricing: 'Free / Pro / Org / Enterprise', url: 'https://figma.com/figjam',
    summary: "Inherits Figma's battle-tested sharing dialog. Public links with password, admin-level kill-switch, open-session controls.",
    permissions:    { verdict: 'good', verdictLabel: 'Role + scope model', keyline: 'View / Edit at the file level; organization scopes (anyone, team-only, org-only) set audience before role.', bullets: ['File- and project-level permissions inherit from team, with explicit overrides.','Can edit vs. can view is the primary axis.','Restrict Copying & Sharing toggle on a file disables copy / export for Viewers.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'Anyone with the link + password', keyline: '\'Anyone with the link\' is on by default for org users. Passwords disable plain link access in favour of link+password.', bullets: ['Org admins can disable public links entirely — every file becomes private.','Open-session controls cap how many anonymous editors can co-edit a file.','Links can be scoped to \'people in your organization\' or \'people invited\' instead of fully public.'] },
    externalGuest:  { verdict: 'good', verdictLabel: 'Link-based + explicit invites', keyline: 'External collaborators can join through public links (no Figma seat) or explicit email invites (may consume a seat depending on role).', bullets: ['Viewers are free on most plans; Editor seats cost money.','Open sessions let non-signed-in collaborators edit in FigJam.','Org-level admin toggles govern both external link-sharing and guest-invite flows.'] },
    sources: [{ label: 'Guide to sharing & permissions', url: 'https://help.figma.com/hc/en-us/articles/1500007609322-Guide-to-sharing-and-permissions' },{ label: 'Manage public links & open sessions', url: 'https://help.figma.com/hc/en-us/articles/5726756336791-Manage-public-link-sharing-and-open-sessions' }] },
  { id: 'lucidspark', name: 'Lucidspark', cat: 'Whiteboard', pricing: 'Free / Individual / Team / Enterprise', url: 'https://lucidspark.com',
    summary: "Lucid's whiteboard. Notable for its 'Guest Collaborator link' — unique in letting non-account holders edit on Enterprise.",
    permissions:    { verdict: 'good', verdictLabel: '4 permission levels', keyline: 'View / Comment / Edit / Edit and Share — more granular than Miro\'s 3.', bullets: ['\'Edit and Share\' grants edit rights plus the ability to re-share the board.','Per-board, assignable via email invite or link.','Licensing tiers govern who can assign which permission.'] },
    publicLink:     { verdict: 'warn', verdictLabel: 'Link-based, Enterprise for edit', keyline: 'Shareable link with configurable permission level. Anonymous editing requires Enterprise\'s Guest Collaborator link.', bullets: ['Not every chart / board exposes the \'Anyone with the link\' option — depends on account type.','Guest Collaborator link is Lucidspark-only.','Join ID flow provides a lighter-weight session entry.'] },
    externalGuest:  { verdict: 'good', verdictLabel: 'No-account editing (Enterprise)', keyline: 'Guest Collaborator link is the only URL in this set that lets a non-account user fully edit — without consuming a paid seat.', bullets: ['Enterprise feature: create a Guest Collaborator link for a Lucidspark board.','Guests don\'t need a licence or an account.','Licensing impact depends on permission level granted.'] },
    sources: [{ label: 'Guest Collaborators in Lucid', url: 'https://help.lucid.co/hc/en-us/articles/13592910415380-Guest-Collaborators-in-Lucid' },{ label: '8 ways to share Lucidspark boards', url: 'https://lucid.co/blog/ways-to-share' }] },
  { id: 'whimsical', name: 'Whimsical', cat: 'Whiteboard', pricing: 'Free / Pro / Business / Enterprise', url: 'https://whimsical.com',
    summary: 'Light, IA-focused collaboration tool. Anonymous comments/edits via toggle, hard guest caps as a pricing lever.',
    permissions:    { verdict: 'good', verdictLabel: 'Viewer / Commenter / Editor', keyline: 'Standard 3-role model, set per-file or per-folder. Inheritance from folder → file unless overridden.', bullets: ['Member roles (Admin / Member / Guest) govern workspace-level privileges.','File-level permissions can override folder inheritance.','Folder-level sharing propagates to contained files.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'Shareable link + password', keyline: 'Airplane icon → Get Shareable Link. Toggle anyone-with-link to view / comment / edit, add password, pin a board view.', bullets: ['\'Allow anonymous comments and updates\' toggle lets non-account users interact.','\'Include board position\' opens the link at a specific view.','Password protection supported.'] },
    externalGuest:  { verdict: 'warn', verdictLabel: 'Hard guest caps per file', keyline: 'Free: 10 / Pro: 50 / Business: 100 / Enterprise: 200 guests per file or folder.', bullets: ['Guest invites are email-based, named.','Guest counts are per-file/folder, not workspace-wide.','Request-access flow for users who hit a private file.'] },
    sources: [{ label: 'Sharing files & access', url: 'https://whimsical.com/learn/faqs/sharing' },{ label: 'Guest access', url: 'https://help.whimsical.com/workspaces/guests' }] },
  { id: 'tldraw', name: 'tldraw', cat: 'Whiteboard', pricing: 'Free web app / SDK', url: 'https://tldraw.com',
    summary: 'Lowest-friction whiteboard in the set. No login, no accounts — drawings are shared by URL, room-based real-time collaboration.',
    permissions:    { verdict: 'warn', verdictLabel: 'Minimal in hosted app', keyline: 'Hosted tldraw.com has near-zero permission surface — whoever has the URL can edit. The SDK exposes editor/viewer roles programmatically.', bullets: ['Hosted app: URL holders co-edit in real time, no account needed.','Self-hosted / SDK: define editor vs viewer via your own auth layer.','Rooms identified by ID; up to ~50 concurrent collaborators per room.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'URL is the permission', keyline: 'Every drawing has a unique URL. Sharing the URL grants access; no separate \'share\' dialog.', bullets: ['No authentication required to view or edit on tldraw.com.','SDK consumers can layer password / auth atop the real-time sync.','No first-party expiry / password / audit flows in the hosted product.'] },
    externalGuest:  { verdict: 'good', verdictLabel: 'Everyone is a guest', keyline: 'All collaborators are de-facto guests. Enterprise-style permissioning is a self-host concern.', bullets: ['Anyone with the URL is a peer collaborator.','No seat accounting.','Privacy depends on keeping the URL secret — no admin controls.'] },
    sources: [{ label: 'tldraw: Collaboration docs', url: 'https://tldraw.dev/docs/collaboration' },{ label: 'Announcing tldraw sync', url: 'https://tldraw.substack.com/p/announcing-tldraw-sync' }] },
  { id: 'notion', name: 'Notion', cat: 'Docs & notes', pricing: 'Free / Plus / Business / Enterprise', url: 'https://notion.so',
    summary: 'Docs + database hybrid. Most granular permission model in the set — 4 tiers, page-level inheritance, and link expiry built-in.',
    permissions:    { verdict: 'good', verdictLabel: '4 levels + Full access', keyline: 'Full access / Can edit / Can comment / Can view. Permissions inherit from parent page; child pages can override.', bullets: ['Full access = Edit + ability to re-share the page.','Page-level; propagates through nested pages.','Teamspaces provide a middle layer between workspace and page.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'Web link with expiry', keyline: '\'Anyone on the web with link\' toggle → view / comment / edit. Optional expiry datetime.', bullets: ['Comment/edit require the anonymous user to sign into Notion.','Link expiry is unusual in this category — Notion was an early mover.','Publish-to-web generates SEO-indexable pages with custom domains (paid).'] },
    externalGuest:  { verdict: 'warn', verdictLabel: 'Powerful, footgun-prone', keyline: 'Invite guests by email with any of the 4 roles. Guest with Full Access can remove Workspace Owners from a page.', bullets: ['Guests don\'t consume a paid Member seat.','Guests appear in the workspace member list but scoped to invited pages only.','Admin audit of guest-granted permissions is less surfaced than enterprise-grade tools.'] },
    sources: [{ label: 'Sharing & permissions', url: 'https://www.notion.com/help/sharing-and-permissions' },{ label: 'Manage members & guests', url: 'https://www.notion.com/help/add-members-admins-guests-and-groups' }] },
  { id: 'evernote', name: 'Evernote', cat: 'Docs & notes', pricing: 'Free / Personal / Professional / Teams', url: 'https://evernote.com',
    summary: 'Legacy note app. Note-level public links work; notebook-level public links do not — meaningful asymmetry for sharing workflows.',
    permissions:    { verdict: 'warn', verdictLabel: 'Per-note simple, per-notebook restricted', keyline: 'Notes: view / edit, anonymous or invited. Notebooks: invited-only, no public URL.', bullets: ['Note permissions: Can view / Can edit / Can edit & invite (for notes).','Notebook permissions: same role set but recipients need Evernote accounts.','Shared content appears in invitees\' \'Shared with Me\' section.'] },
    publicLink:     { verdict: 'warn', verdictLabel: 'Notes only, no notebook URL', keyline: 'Each note gets a unique URL — anonymous view or anonymous edit via the Lite editor. Notebooks cannot be shared publicly.', bullets: ['Anonymous access opens in a reduced \'Lite\' editor.','No password or expiry on note public links.','Notebook-level sharing is invite-only.'] },
    externalGuest:  { verdict: 'bad',  verdictLabel: 'Account required for notebooks', keyline: 'External users can view / edit individual notes anonymously, but notebook collaboration requires an Evernote account.', bullets: ['No guest-role economics (no free-guest tier to call out).','External collaborators on notebooks count as regular invitees.','Less modern than peers on role granularity.'] },
    sources: [{ label: 'Share notes', url: 'https://help.evernote.com/hc/en-us/articles/34377080881939-Share-notes' }] },
  { id: 'canva', name: 'Canva', cat: 'Design', pricing: 'Free / Pro / Teams / Enterprise', url: 'https://canva.com',
    summary: 'Design surface with the broadest consumer footprint. Sharing feels like Google Docs but layered with team-discovery and brand controls.',
    permissions:    { verdict: 'good', verdictLabel: '3-role + scope + discovery', keyline: 'Can edit / Can comment / Can view across scopes: Only you / Only your team / Anyone with the link. Team-discovery toggle controls search visibility.', bullets: ['Team plan: Admin / Member / Template Designer roles for team-level governance.','Per-design sharing overrides default team visibility.','Restrict Design Sharing controls prevent members from re-sharing externally.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'Anyone with the link (edit-capable)', keyline: 'Unusual for a design tool: anonymous users can edit a shared design with no Canva account.', bullets: ['Team discovery: opt in to show the design in search, or require the link.','Design can be published (template / website / social post) independent of editor sharing.','Enterprise restricts external sharing from central admin.'] },
    externalGuest:  { verdict: 'warn', verdictLabel: 'Generous but category-confused', keyline: 'External collaboration primarily flows through public links — no dedicated \'Guest\' role surface like whiteboard tools.', bullets: ['No seat cost for link-based collaborators.','Teams plan required for team-level sharing scopes.','Secure-sharing guidance is a separate documentation pillar.'] },
    sources: [{ label: 'Share your Canva design', url: 'https://www.canva.com/help/collaborate-with-anyone/' },{ label: 'Roles and permissions', url: 'https://www.canva.com/help/roles-and-permissions/' }] },
  { id: 'lovable', name: 'Lovable', cat: 'AI Builder', pricing: 'Free / Pro / Business / Enterprise', url: 'https://lovable.dev',
    summary: "AI app builder. Clean split between 'publish the app' (public URL, no code access) and 'share the project' (editor access for collaborators).",
    permissions:    { verdict: 'good', verdictLabel: '4 roles: Viewer / Editor / Admin / Owner', keyline: 'Published permission matrix in docs. Clear escalation — Owners transfer/delete, Admins manage settings, Editors build.', bullets: ['Only Editors+ can publish, edit, change visibility.','Only Admins+ can manage settings, disconnect Supabase, transfer/delete.','Only Owners can add/remove other owners.','Project-level and Workspace-level role matrices are documented separately.'] },
    publicLink:     { verdict: 'good', verdictLabel: 'Published URL ≠ editor access', keyline: 'Publishing exposes the running app at a public URL but doesn\'t leak source or editor rights.', bullets: ['Published app URL is end-user facing; viewers can\'t see the code.','Editor sharing happens via email invite with seat accounting.','Enterprise: restrict external publishing to Admins & Owners, or Owners only.'] },
    externalGuest:  { verdict: 'warn', verdictLabel: 'Email invite + paid roles', keyline: 'No free-guest tier. External collaborators are invited by email into a workspace or a specific project.', bullets: ['Project-level invite = scoped access to one build.','Workspace-level invite = access to every project in the workspace.','Collaborators draw credits from the project/workspace owner.'] },
    sources: [{ label: 'Collaboration docs', url: 'https://docs.lovable.dev/features/collaboration' },{ label: 'Project visibility', url: 'https://docs.lovable.dev/features/project-visibility' }] },
  { id: 'perplexity', name: 'Perplexity', cat: 'AI Research', pricing: 'Free / Pro / Enterprise', url: 'https://perplexity.ai',
    summary: "AI answer engine. Two distinct primitives — Thread (single Q&A, link-shareable) and Space (invited collaborators with roles).",
    permissions:    { verdict: 'good', verdictLabel: 'Thread vs Space', keyline: 'Threads: link-based. Spaces: Viewer / Contributor roles with email invite or link share.', bullets: ['Threads are private by default; become public only on explicit share.','Space Contributor: can start threads and ask follow-ups.','Space Viewer: read-only.','Enterprise org permissions add admin / member / read-only layers.'] },
    publicLink:     { verdict: 'good', verdictLabel: '\'Sharable\' toggle per thread', keyline: 'Click Share on a Thread → \'Sharable\' toggle generates a link anyone can view. Link also re-shareable by recipients.', bullets: ['Thread public view is anonymous — no Perplexity account needed.','No view / edit split for Threads — public means viewable only.','Spaces shared via link can grant Viewer or Contributor role.'] },
    externalGuest:  { verdict: 'warn', verdictLabel: 'Space-scoped only', keyline: 'External users can view shared Threads anonymously or be invited to Spaces with Viewer / Contributor role.', bullets: ['Space membership controlled by role, not billing.','Thread sharing in a Space defaults to \'shared\' to keep members aligned.','Enterprise adds org-level permission scaffolding.'] },
    sources: [{ label: 'What are Spaces?', url: 'https://www.perplexity.ai/help-center/en/articles/10352961-what-are-spaces' },{ label: 'What is a Thread?', url: 'https://www.perplexity.ai/help-center/en/articles/10354769-what-is-a-thread' }] },
  { id: 'claude', name: 'Claude', cat: 'AI Assistant', pricing: 'Free / Pro / Team / Enterprise', url: 'https://claude.ai',
    summary: "Projects bound to the organisation. 'Public' means org-visible — never open internet. Individual chats shareable via private links.",
    permissions:    { verdict: 'good', verdictLabel: 'Can use / Can edit', keyline: 'Project members hold Can use or Can edit. Can edit modifies instructions, knowledge, and membership.', bullets: ['Can use: see contents, knowledge, instructions; chat within the project.','Can edit: all of the above plus modify project, add/remove members.','Project visibility: Private (invited only) or Public (everyone in org).','Team / Enterprise plans only — Free / Pro don\'t expose project sharing.'] },
    publicLink:     { verdict: 'warn', verdictLabel: '\'Public\' is org-scoped', keyline: 'No anonymous-on-the-internet sharing. \'Public project\' = visible to everyone in your organisation; individual chats can be shared via private link.', bullets: ['Chat share link is private — requires knowledge of URL, no auth flow to view.','Projects are never exposed to the open internet.','Enterprise controls shape who in the org can make projects public.'] },
    externalGuest:  { verdict: 'bad',  verdictLabel: 'No external-guest model', keyline: "Claude doesn't offer a guest-collaborator surface. All collaborators are org members.", bullets: ['External sharing = sending the private chat link out-of-band.','No concept of a free-guest seat or scoped external collaborator.','Project membership bound to org identity.'] },
    sources: [{ label: 'Manage project visibility and sharing', url: 'https://support.claude.com/en/articles/9519189-manage-project-visibility-and-sharing' },{ label: 'Sharing and unsharing chats', url: 'https://support.claude.com/en/articles/10593882-sharing-and-unsharing-chats' }] }
];

const DIM_KEY_MAP = {
  permissions:    'permissions',
  publicLink:     'public-link',
  externalGuest:  'external-guest'
};

const sharingApps = SHARING_APPS_RAW.map(raw => {
  const appId = raw.id + '-' + crypto.randomBytes(3).toString('hex');
  const findings = {};
  for (const [rawKey, dimId] of Object.entries(DIM_KEY_MAP)) {
    if (raw[rawKey]) {
      findings[dimId] = { ...raw[rawKey], source: 'manual' };
    }
  }
  return {
    id: appId,
    name: raw.name,
    url: raw.url,
    category: raw.cat,
    pricing: raw.pricing,
    summary: raw.summary,
    sources: raw.sources || [],
    findings,
    createdAt: new Date().toISOString()
  };
});

const sharingTopic = {
  id: 'sharing',
  name: 'Sharing & Permissions',
  icon: '🔗',
  description: 'How 12 collaborative tools handle sharing — permission models, public/anonymous links, and external guest access.',
  dimensions: SHARING_DIMS,
  apps: sharingApps,
  readOnly: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

const sharingTopicPath = path.join(DATA, 'topic-sharing.json');
fs.writeFileSync(sharingTopicPath, JSON.stringify(sharingTopic, null, 2));
console.log(`✓ Created data/topic-sharing.json with ${sharingApps.length} apps`);

// ─── 3. UPDATE TOPICS INDEX ──────────────────────────────────────────────────
const topicsPath = path.join(DATA, 'topics.json');
let topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));

// Remove old builtIn sharing entry (any entry with builtInUrl or id === 'sharing')
topics = topics.filter(t => !(t.builtIn && (t.builtInUrl || t.id === 'sharing')));

// Add the standard sharing topic entry at the front
const sharingMeta = {
  id: 'sharing',
  name: 'Sharing & Permissions',
  icon: '🔗',
  description: 'How 12 collaborative tools handle sharing — permission models, public/anonymous links, and external guest access.',
  readOnly: true,
  appCount: sharingApps.length,
  dimensionCount: SHARING_DIMS.length,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

topics = [sharingMeta, ...topics];
fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2));
console.log(`✓ Updated data/topics.json (${topics.length} topics, sharing is now standard)`);

console.log('\nMigration complete. Restart the server.');
