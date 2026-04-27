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

const ALLOWED_EXTS = new Set(['.png','.jpg','.jpeg','.webp','.gif']);

fs.mkdirSync(DATA, { recursive: true });

// ─── ATOMIC WRITE + PER-TOPIC MUTEX ─────────────────────────────────────────
// Write to a temp file then rename — prevents truncated JSON on crash.
function atomicWrite(filePath, content) {
  const tmp = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

// Serialize async operations on the same topic so concurrent SSE streams
// can't interleave their read-modify-write cycles.
const topicLocks = new Map();
async function withTopicLock(topicId, fn) {
  const prev = topicLocks.get(topicId) || Promise.resolve();
  let release;
  const lock = new Promise(r => { release = r; });
  topicLocks.set(topicId, lock);
  await prev;
  try   { return await fn(); }
  finally { release(); if (topicLocks.get(topicId) === lock) topicLocks.delete(topicId); }
}

app.use(express.json());

// Redirect bare root to the platform home before static middleware intercepts it
app.get('/', (_req, res) => res.redirect('/platform.html'));

// /topics/sharing → visual gallery (index.html)
app.get('/topics/sharing', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// /topics/:id → topic research view (topic.html), ID passed via path
app.get('/topics/:id', (_req, res) => res.sendFile(path.join(ROOT, 'topic.html')));

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
  atomicWrite(path.join(DATA, 'topics.json'), JSON.stringify(list, null, 2));
}

// ─── TOOL REGISTRY ───────────────────────────────────────────────────────────
function toolsFile() { return path.join(DATA, 'tools.json'); }

function loadTools() {
  const f = toolsFile();
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function saveTools(list) {
  atomicWrite(toolsFile(), JSON.stringify(list, null, 2));
}

function topicFile(id) { return path.join(DATA, `topic-${id}.json`); }

function loadTopic(id) {
  const f = topicFile(id);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function saveTopic(topic) {
  topic.updatedAt = new Date().toISOString();
  atomicWrite(topicFile(topic.id), JSON.stringify(topic, null, 2));
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

function isKnownLegacyTool(tool) {
  // For legacy screenshot routes: check registry or allow any safe slug
  const tools = loadTools();
  if (tools.some(t => t.id === tool)) return true;
  // Fallback: allow safe slugs (letters, numbers, hyphens only)
  return /^[a-z0-9-]{1,40}$/.test(tool);
}

const legacyUpload = multer({
  storage: multer.diskStorage({
    destination(req, _res, cb) {
      const tool = req.params.tool;
      if (!isKnownLegacyTool(tool)) return cb(new Error('unknown tool'));
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
  if (!isKnownLegacyTool(tool)) return res.status(400).json({ error: 'unknown tool' });
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
  if (!isKnownLegacyTool(tool)) return res.status(400).json({ error: 'unknown tool' });
  const dir = path.join(ROOT, 'user-screenshots', tool);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter(f => ALLOWED_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => ({ file: f, url: `/user-screenshots/${tool}/${f}` }));
  res.json(files);
});

// ─────────────────────────────────────────────
// topics
// ─────────────────────────────────────────────

app.get('/api/status', (_req, res) => {
  res.json({ aiEnabled: !!process.env.ANTHROPIC_API_KEY });
});

// ─── TOOL REGISTRY ────────────────────────────────────────────────────────────
app.get('/api/tools', (_req, res) => res.json(loadTools()));

app.post('/api/tools', (req, res) => {
  const { name, category = '', pricing = '', url = '', summary = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const tools = loadTools();
  const id = safeId(name);
  if (tools.some(t => t.id === id)) return res.status(409).json({ error: 'tool id already exists' });
  const tool = { id, name, category, pricing, url, summary };
  saveTools([...tools, tool]);
  res.status(201).json(tool);
});

app.put('/api/tools/:id', (req, res) => {
  const tools = loadTools();
  const idx = tools.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const updated = { ...tools[idx], ...req.body, id: tools[idx].id }; // id immutable
  const newList = [...tools.slice(0, idx), updated, ...tools.slice(idx + 1)];
  saveTools(newList);
  res.json(updated);
});

app.delete('/api/tools/:id', (req, res) => {
  const tools = loadTools();
  if (!tools.some(t => t.id === req.params.id)) return res.status(404).json({ error: 'not found' });
  saveTools(tools.filter(t => t.id !== req.params.id));
  res.json({ ok: true });
});

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
  // Merge index-level fields (e.g. galleryUrl, readOnly) into the full topic response
  const indexEntry = topicsIndex().find(t => t.id === req.params.id) || {};
  res.json({ ...indexEntry, ...topic });
});

app.put('/api/topics/:id', (req, res) => {
  const topic = loadTopic(req.params.id);
  if (!topic) return res.status(404).json({ error: 'not found' });
  if (topic.readOnly) return res.status(403).json({ error: 'Topic is read-only' });
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
  const topic = loadTopic(req.params.id);
  if (topic && topic.readOnly) return res.status(403).json({ error: 'Topic is read-only' });
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
  if (findings) {
    const stamped = Object.fromEntries(
      Object.entries(findings).map(([k, v]) => [k, { ...v, source: v.source || 'manual' }])
    );
    app.findings = { ...app.findings, ...stamped };
  }
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

/** Get all tools from the registry for use in research. */
function getCanonicalTools() {
  return loadTools();
}

/** Call the Anthropic Messages API and return the text content.
 *  Uses claude-haiku-4-5 by default — same factual quality at ~15× lower cost.
 *  max_tokens is sized to fit all dimensions in one batched response.
 */
async function claudeComplete(apiKey, userPrompt, maxTokens = 500) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json'
    },
    body: JSON.stringify({
      model:      process.env.CLAUDE_RESEARCH_MODEL || 'claude-haiku-4-5',
      max_tokens: maxTokens,
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

/**
 * Research ALL dimensions for one tool in a single API call.
 * Returns a map of { [dimId]: findingObject }.
 * Dims already covered by a manual finding are passed as skipIds and excluded.
 */
async function researchToolAllDims(apiKey, topic, tool, dims) {
  // Build a compact dimension list for the prompt
  const dimList = dims.map((d, i) => `${i + 1}. id="${d.id}" name="${d.name}"`).join('\n');

  const prompt = `You are populating a UX benchmark database with factual, specific research.

TOPIC:    ${topic.name}
CONTEXT:  ${topic.description || topic.name}
TOOL:     ${tool.name}
CATEGORY: ${tool.category || 'SaaS tool'}
URL:      ${tool.url || 'N/A'}
${tool.summary ? `SUMMARY:  ${tool.summary}` : ''}

Evaluate ${tool.name} on each of these dimensions:
${dimList}

Return ONLY a valid JSON object keyed by dimension id — no markdown, no extra text:
{
  "<dim-id>": {
    "verdict": "good" | "warn" | "bad",
    "verdictLabel": "2-5 word label",
    "keyline": "1-2 factual sentences.",
    "bullets": ["Concrete observation.", "Concrete observation.", "Concrete observation."]
  }
}

Rules:
- verdict is exactly one of: good, warn, bad
- verdictLabel is 2-5 words describing the approach
- keyline is 1-2 sentences, specific and factual
- bullets is 2-4 items, each a concrete detail`;

  // Allow ~140 tokens per dimension for a batched response
  const maxTokens = dims.length * 140 + 80;
  const text = await claudeComplete(apiKey, prompt, maxTokens);
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

  const send = (obj) => { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch (_) {} };

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

  // ── run lock: prevent duplicate research streams ───────────────────────────
  if (topic.researchInProgress) {
    const age = topic.researchStartedAt
      ? Math.round((Date.now() - new Date(topic.researchStartedAt).getTime()) / 1000)
      : '?';
    send({ type: 'error', message: `Research is already running (started ${age}s ago). Wait for it to finish or restart the server to clear the lock.` });
    return res.end();
  }

  const dims = topic.dimensions || [];
  if (dims.length === 0) {
    send({ type: 'error', message: 'This topic has no dimensions. Add at least one before running research.' });
    return res.end();
  }

  const tools = getCanonicalTools();
  if (tools.length === 0) {
    send({ type: 'error', message: 'No tools in registry. Run scripts/migrate-2x.js to initialise data/tools.json.' });
    return res.end();
  }

  // Force-refresh flag lets the caller re-research dims already marked manual.
  const forceAll = req.query.force === '1';

  // set run lock
  topic.researchInProgress = true;
  topic.researchStartedAt  = new Date().toISOString();
  saveTopic(topic);

  const total = tools.length * dims.length;
  send({ type: 'start', tools: tools.length, dims: dims.length, total });

  let done = 0;

  const clearLock = () => {
    try {
      const t = loadTopic(topic.id);
      if (t) { t.researchInProgress = false; t.researchStartedAt = null; saveTopic(t); }
    } catch (_) {}
  };

  // Abort if client disconnects
  let aborted = false;
  res.on('close', () => { aborted = true; clearLock(); });

  try {
    for (const tool of tools) {
      if (aborted) break;

      // Ensure app exists — do this under the topic lock
      let existingFindings = {};
      await withTopicLock(topic.id, async () => {
        const t   = loadTopic(topic.id);
        const idx = (t.apps || []).findIndex(a => a.name.toLowerCase() === tool.name.toLowerCase());
        if (idx === -1) {
          const appId = safeId(tool.name) + '-' + crypto.randomBytes(3).toString('hex');
          t.apps = [...(t.apps || []), {
            id: appId, name: tool.name, url: tool.url || '', category: tool.category || '',
            pricing: tool.pricing || '', summary: tool.summary || '', sources: tool.sources || [],
            findings: {}, createdAt: new Date().toISOString()
          }];
          saveTopic(t);
        } else {
          existingFindings = t.apps[idx].findings || {};
        }
      });

      // Skip dims that already have a manual finding (unless force=1)
      const dimsToResearch = forceAll
        ? dims
        : dims.filter(d => {
            const f = existingFindings[d.id];
            return !f || f.source !== 'manual';
          });

      // Emit skipped dims as synthetic findings so the progress counter is accurate
      const skippedDims = dims.filter(d => !dimsToResearch.includes(d));
      for (const dim of skippedDims) {
        done++;
        const f = existingFindings[dim.id];
        send({ type: 'finding', tool: tool.name, dim: dim.name, verdict: f.verdict, verdictLabel: f.verdictLabel, done, total, skipped: true });
      }

      if (dimsToResearch.length === 0) continue;

      send({ type: 'progress', tool: tool.name, dims: dimsToResearch.length });

      // ── One batched API call for all pending dims of this tool ─────────────
      let batchResult = null;
      let batchError  = null;
      try {
        batchResult = await researchToolAllDims(apiKey, topic, tool, dimsToResearch);
      } catch (e) {
        batchError = e;
      }

      // ── Write all findings for this tool in one locked operation ───────────
      if (batchResult) {
        await withTopicLock(topic.id, async () => {
          const fresh = loadTopic(topic.id);
          const idx   = (fresh.apps || []).findIndex(a => a.name.toLowerCase() === tool.name.toLowerCase());
          if (idx !== -1) {
            for (const dim of dimsToResearch) {
              const finding = batchResult[dim.id];
              if (finding) {
                fresh.apps[idx].findings = {
                  ...fresh.apps[idx].findings,
                  [dim.id]: { ...finding, source: 'ai' }
                };
              }
            }
            saveTopic(fresh);
          }
        });
      }

      // ── Emit events for this tool's findings ───────────────────────────────
      for (const dim of dimsToResearch) {
        done++;
        if (batchError) {
          send({ type: 'finding-error', tool: tool.name, dim: dim.name, message: batchError.message, done, total });
        } else {
          const finding = batchResult && batchResult[dim.id];
          if (finding) {
            send({ type: 'finding', tool: tool.name, dim: dim.name, verdict: finding.verdict, verdictLabel: finding.verdictLabel, done, total });
          } else {
            send({ type: 'finding-error', tool: tool.name, dim: dim.name, message: 'No result returned for this dimension', done, total });
          }
        }
      }
    }
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    if (!aborted) {
      clearLock();
      send({ type: 'done', total: done });
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`\nUX Research Platform → http://localhost:${PORT}\n`);
});
