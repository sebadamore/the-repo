const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3344;
const ROOT = __dirname;

const ALLOWED_TOOLS = [
  'stormboard','miro','figjam','lucidspark','whimsical',
  'tldraw','notion','evernote','canva','lovable','perplexity','claude'
];
const ALLOWED_EXTS = new Set(['.png','.jpg','.jpeg','.webp','.gif']);

// ── serve static files ──
app.use(express.static(ROOT));

// ── upload ──
const storage = multer.diskStorage({
  destination(req, res, cb) {
    const tool = req.params.tool;
    if (!ALLOWED_TOOLS.includes(tool)) return cb(new Error('unknown tool'));
    const dir = path.join(ROOT, 'user-screenshots', tool);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) return cb(new Error('bad extension'));
    const tool = req.params.tool;
    const dir  = path.join(ROOT, 'user-screenshots', tool);
    // find next available slot (01..20)
    let slot = null;
    for (let i = 1; i <= 20; i++) {
      const prefix = String(i).padStart(2,'0');
      const taken  = ALLOWED_EXTS;
      const occupied = [...taken].some(e => fs.existsSync(path.join(dir, `${prefix}${e}`)));
      if (!occupied) { slot = prefix; break; }
    }
    if (!slot) return cb(new Error('no slots available (max 20)'));
    cb(null, `${slot}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

app.post('/api/screenshots/:tool', upload.array('files', 20), (req, res) => {
  const saved = req.files.map(f => `user-screenshots/${req.params.tool}/${f.filename}`);
  res.json({ ok: true, saved });
});

// ── delete ──
app.delete('/api/screenshots/:tool/:file', (req, res) => {
  const tool = req.params.tool;
  const file = req.params.file;
  if (!ALLOWED_TOOLS.includes(tool)) return res.status(400).json({ error: 'unknown tool' });
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) return res.status(400).json({ error: 'bad extension' });
  const target = path.resolve(path.join(ROOT, 'user-screenshots', tool, file));
  const safeDir = path.resolve(path.join(ROOT, 'user-screenshots', tool));
  if (!target.startsWith(safeDir)) return res.status(400).json({ error: 'bad path' });
  try {
    fs.unlinkSync(target);
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: 'file not found' });
  }
});

// ── list ──
app.get('/api/screenshots/:tool', (req, res) => {
  const tool = req.params.tool;
  if (!ALLOWED_TOOLS.includes(tool)) return res.status(400).json({ error: 'unknown tool' });
  const dir = path.join(ROOT, 'user-screenshots', tool);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter(f => ALLOWED_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => ({ file: f, url: `user-screenshots/${tool}/${f}` }));
  res.json(files);
});

app.listen(PORT, () => {
  console.log(`\nSharing UX Gallery → http://localhost:${PORT}\n`);
});
