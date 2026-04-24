const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

// lightweight .env loader — no package required
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq < 1) return;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  });
} catch (_) {}

const app  = express();
const PORT = process.env.PORT || 3344;
const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');

const ALLOWED_TOOLS = [
  'stormboard','miro','figjam','lucidspark','whimsical',
  'tldraw','notion','evernote','canva','lovable','perplexity','claude'
];
const ALLOWED_EXTS = new Set(['.png','.jpg','.jpeg','.webp','.gif']);

fs.mkdirSync(DATA, { recursive: true });

app.use(express.json());
app.use(express.static(ROOT));

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────

function safeId(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

function topicsIndex() {
  const f = path.join(DATA, 'topics.json');
  if (!fs.existsSync(f)) { fs.writeFileSync(f, '[]'); return []; }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function saveTopicsIndex(list) {
  fs.writeFileSync(path.join(DATA, 'topics.json'), JSON.stringify(list, null, 2));
}

function topicFile(id) { return path.join(DATA, `topic-${id}.json`); }

function loadTopic(id) {
  const f = topicFile(id);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function saveTopic(topic) {
  topic.updatedAt = new Date().toISOString();
  fs.writeFileSync(topicFile(topic.id), JSON.stringify(topic, null, 2));
  // sync index
  const list = topicsIndex();
  const idx  = list.findIndex(t => t.id === topic.id);
  const meta = {
    id: topic.id, name: topic.name, icon: topic.icon,
    description: topic.description, builtIn: false,
    appCount: (topic.apps || []).length,
    dimensionCount: (topic.dimensions || []).length,
    createdAt: topic.createdAt, updatedAt: topic.updatedAt
  };
  if (idx === -1) list.push(meta); else list[idx] = meta;
  saveTopicsIndex(list);
}

function screenshotDir(topicId, appId) {
  return path.join(ROOT, 'user-screenshots', 'topics', topicId, appId);
}

function listScreenshots(topicId, appId) {
  const dir = screenshotDir(topicId, appId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => ALLOWED_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => ({ file: f, url: `user-screenshots/topics/${topicId}/${appId}/${f}` }));
}

function nextSlot(dir) {
  for (let i = 1; i <= 40; i++) {
    const prefix = String(i).padStart(2, '0');
    const taken = [...ALLOWED_EXTS].some(e => fs.existsSync(path.join(dir, `${prefix}${e}`)));
    if (!taken) return prefix;
  }
  return null;
}

// ─────────────────────────────────────────────
// legacy sharing benchmark screenshots
// ─────────────────────────────────────────────

const legacyUpload = multer({
  storage: multer.diskStorage({
    destination(req, _res, cb) {
      const tool = req.params.tool;
      if (!ALLOWED_TOOLS.includes(tool)) return cb(new Error('unknown tool'));
      const dir = path.join(ROOT, 'user-screenshots', tool);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext  = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTS.has(ext)) return cb(new Error('bad extension'));
      const dir  = path.join(ROOT, 'user-screenshots', req.params.tool);
      const slot = nextSlot(dir);
      if (!slot) return cb(new Error('no slots available (max 40)'));
      cb(null, `${slot}${ext}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.post('/api/screenshots/:tool', legacyUpload.array('files', 40), (req, res) => {
  const saved = req.files.map(f => `user-screenshots/${req.params.tool}/${f.filename}`);
  res.json({ ok: true, saved });
});

app.delete('/api/screenshots/:tool/:file', (req, res) => {
  const { tool, file } = req.params;
  if (!ALLOWED_TOOLS.includes(tool)) return res.status(400).json({ error: 'unknown tool' });
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) return res.status(400).json({ error: 'bad extension' });
  const target  = path.resolve(path.join(ROOT, 'user-screenshots', tool, file));
  const safeDir = path.resolve(path.join(ROOT, 'user-screenshots', tool));
  if (!target.startsWith(safeDir)) return res.status(400).json({ error: 'bad path' });
  try { fs.unlinkSync(target); res.json({ ok: true }); }
  catch { res.status(404).json({ error: 'file not found' }); }
});

app.get('/api/screenshots/:tool', (req, res) => {
  const { tool } = req.params;
  if (!ALLOWED_TOOLS.includes(tool)) return res.status(400).json({ error: 'unknown tool' });
  const dir = path.join(ROOT, 'user-screenshots', tool);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter(f => ALLOWED_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => ({ file: f, url: `user-screenshots/${tool}/${f}` }));
  res.json(files);
});

// ─────────────────────────────────────────────
// topics
// ─────────────────────────────────────────────

app.get('/api/topics', (_req, res) => res.json(topicsIndex()));

app.post('/api/topics', (req, res) => {
  const { name, icon = '📋', description = '', dimensions = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const base = safeId(name);
  let id = base;
  let n  = 1;
  while (fs.existsSync(topicFile(id))) { id = `${base}-${n++}`; }
  const topic = {
    id, name, icon, description,
    dimensions: dimensions.map(d => ({ id: safeId(d.name || d), name: d.name || d })),
    apps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveTopic(topic);
  res.status(201).json(topic);
});

app.get('/api/topics/:id', (req, res) => {
  const topic = loadTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'not found' });
  res.json(topic);
});

app.put('/api/topics/:id', (req, res) => {
  const topic = loadTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'not found' });
  const { name, icon, description, dimensions } = req.body;
  if (name)        topic.name        = name;
  if (icon)        topic.icon        = icon;
  if (description !== undefined) topic.description = description;
  if (dimensions)  topic.dimensions  = dimensions;
  saveTopic(topic);
  res.json(topic);
});

app.delete('/api/topics/:id', (req, res) => {
  const f = topicFile(req.params.id);
  if (!fs.existsSync(f)) return res.status(404).json({ error: 'not found' });
  fs.unlinkSync(f);
  const list = topicsIndex().filter(t => t.id !== req.params.id);
  saveTopicsIndex(list);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// apps within a topic
// ─────────────────────────────────────────────

app.post('/api/topics/:id/apps', (req, res) => {
  const topic = loadTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'not found' });
  const { name, url = '', category = '', pricing = '', summary = '', sources = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const appId = safeId(name) + '-' + crypto.randomBytes(3).toString('hex');
  const app = { id: appId, name, url, category, pricing, summary, sources, findings: {}, createdAt: new Date().toISOString() };
  topic.apps = [...(topic.apps || []), app];
  saveTopic(topic);
  res.status(201).json(app);
});

app.put('/api/topics/:id/apps/:appId', (req, res) => {
  const topic = loadTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'not found' });
  const idx = topic.apps.findIndex(a => a.id === req.params.appId);
  if (idx === -1) return res.status(404).json({ error: 'app not found' });
  const { name, url, category, pricing, summary, sources, findings } = req.body;
  const app = { ...topic.apps[idx] };
  if (name)               app.name     = name;
  if (url !== undefined)  app.url      = url;
  if (category)           app.category = category;
  if (pricing !== undefined) app.pricing = pricing;
  if (summary !== undefined) app.summary = summary;
  if (sources  !== undefined) app.sources = sources;
  if (findings) app.findings = { ...app.findings, ...findings };
  topic.apps = [...topic.apps.slice(0, idx), app, ...topic.apps.slice(idx + 1)];
  saveTopic(topic);
  res.json(app);
});

app.delete('/api/topics/:id/apps/:appId', (req, res) => {
  const topic = loadTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'not found' });
  topic.apps = topic.apps.filter(a => a.id !== req.params.appId);
  saveTopic(topic);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// screenshots per topic/app
// ─────────────────────────────────────────────

const topicUpload = multer({
  storage: multer.diskStorage({
    destination(req, _res, cb) {
      const dir = screenshotDir(req.params.id, req.params.appId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext  = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTS.has(ext)) return cb(new Error('bad extension'));
      const dir  = screenshotDir(req.params.id, req.params.appId);
      const slot = nextSlot(dir);
      if (!slot) return cb(new Error('no slots available'));
      cb(null, `${slot}${ext}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.get('/api/topics/:id/apps/:appId/screenshots', (req, res) => {
  res.json(listScreenshots(req.params.id, req.params.appId));
});

app.post('/api/topics/:id/apps/:appId/screenshots',
  topicUpload.array('files', 40), (req, res) => {
    res.json({ ok: true, screenshots: listScreenshots(req.params.id, req.params.appId) });
  });

app.delete('/api/topics/:id/apps/:appId/screenshots/:file', (req, res) => {
  const { id, appId, file } = req.params;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) return res.status(400).json({ error: 'bad extension' });
  const dir    = screenshotDir(id, appId);
  const target = path.resolve(path.join(dir, file));
  if (!target.startsWith(path.resolve(dir))) return res.status(400).json({ error: 'bad path' });
  try { fs.unlinkSync(target); res.json({ ok: true }); }
  catch { res.status(404).json({ error: 'not found' }); }
});

// ─────────────────────────────────────────────
// AI research
// ─────────────────────────────────────────────

/** Collect every unique app across all non-builtIn topics, excluding `skipId`. */
function getCanonicalTools(skipId) {
  const list = topicsIndex();
  const seen = new Map(); // name.toLowerCase() → app data
  for (const t of list) {
    if (t.builtIn || t.id === skipId) continue;
    const full = loadTopic(t.id);
    if (!full) continue;
    for (const a of (full.apps || [])) {
      const key = a.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, {
          name:     a.name,
          url:      a.url      || '',
          category: a.category || '',
          pricing:  a.pricing  || '',
          summary:  a.summary  || '',
          sources:  a.sources  || []
        });
      }
    }
  }
  return [...seen.values()];
}

/** Call the Anthropic Messages API and return the text content. */
async function claudeComplete(apiKey, userPrompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json'
    },
    body: JSON.stringify({
      model:      'claude-opus-4-5',
      max_tokens: 900,
      messages:   [{ role: 'user', content: userPrompt }]
    })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${r.status}`);
  }
  const data = await r.json();
  return data.content[0].text.trim();
}

/** Research one tool × dimension, return a finding object. */
async function researchFinding(apiKey, topic, tool, dim) {
  const prompt = `You are populating a UX benchmark database with factual, specific research.

TOPIC:     ${topic.name}
CONTEXT:   ${topic.description || topic.name}
DIMENSION: ${dim.name}
TOOL:      ${tool.name}
CATEGORY:  ${tool.category || 'SaaS tool'}
URL:       ${tool.url || 'N/A'}

Based on your knowledge of ${tool.name}, evaluate how it performs on "${dim.name}" in the context of "${topic.name}".

Return ONLY valid JSON — no markdown fences, no explanation, nothing else:
{
  "verdict": "good" | "warn" | "bad",
  "verdictLabel": "3-6 word label (e.g. 'Clean 3-role model')",
  "keyline": "1-2 factual sentences summarising the key finding.",
  "bullets": [
    "Specific concrete observation 1.",
    "Specific concrete observation 2.",
    "Specific concrete observation 3.",
    "Specific concrete observation 4."
  ]
}

Rules:
- verdict must be exactly one of: good, warn, bad
- verdictLabel is 3-6 words, descriptive of the approach
- keyline is 1-2 sentences, specific and factual, no vague adjectives
- bullets is 3-5 items, each a concrete observation with specifics`;

  const text = await claudeComplete(apiKey, prompt);

  // strip any accidental markdown fences
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

/** SSE research stream — GET /api/topics/:id/research/stream */
app.get('/api/topics/:id/research/stream', async (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    send({ type: 'error', message: 'ANTHROPIC_API_KEY is not set. Add it to a .env file or export it in your shell.' });
    return res.end();
  }

  const topic = loadTopic(req.params.id);
  if (!topic) {
    send({ type: 'error', message: 'Topic not found.' });
    return res.end();
  }

  const dims = topic.dimensions || [];
  if (dims.length === 0) {
    send({ type: 'error', message: 'This topic has no dimensions. Add at least one dimension before running research.' });
    return res.end();
  }

  const tools = getCanonicalTools(topic.id);
  if (tools.length === 0) {
    send({ type: 'error', message: 'No tools found in other topics to research. Create the sign-up or sharing topic first so the tool list can be detected.' });
    return res.end();
  }

  const total = tools.length * dims.length;
  send({ type: 'start', tools: tools.length, dims: dims.length, total });

  let done = 0;

  for (const tool of tools) {
    // Ensure the app exists in this topic
    let appIdx = (topic.apps || []).findIndex(a => a.name.toLowerCase() === tool.name.toLowerCase());
    if (appIdx === -1) {
      const appId = safeId(tool.name) + '-' + crypto.randomBytes(3).toString('hex');
      const newApp = {
        id: appId, name: tool.name, url: tool.url, category: tool.category,
        pricing: tool.pricing, summary: tool.summary, sources: tool.sources,
        findings: {}, createdAt: new Date().toISOString()
      };
      topic.apps = [...(topic.apps || []), newApp];
      appIdx = topic.apps.length - 1;
      saveTopic(topic);
    }

    for (const dim of dims) {
      send({ type: 'progress', tool: tool.name, dim: dim.name, done, total });

      try {
        const finding = await researchFinding(apiKey, topic, tool, dim);
        // Re-read topic in case something else mutated it
        const fresh = loadTopic(topic.id);
        const idx   = fresh.apps.findIndex(a => a.name.toLowerCase() === tool.name.toLowerCase());
        if (idx !== -1) {
          fresh.apps[idx].findings = { ...fresh.apps[idx].findings, [dim.id]: finding };
          saveTopic(fresh);
          // keep our working copy in sync
          topic.apps = fresh.apps;
        }
        done++;
        send({ type: 'finding', tool: tool.name, dim: dim.name, verdict: finding.verdict, verdictLabel: finding.verdictLabel, done, total });
      } catch (e) {
        done++;
        send({ type: 'finding-error', tool: tool.name, dim: dim.name, message: e.message, done, total });
      }
    }
  }

  send({ type: 'done', total: done });
  res.end();
});

app.listen(PORT, () => {
  console.log(`\nUX Research Platform → http://localhost:${PORT}\n`);
});
