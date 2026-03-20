// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
const { login, verifyToken, authMiddleware } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

// Dossier uploads accessible via /uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Format non supporté (jpg, png, gif, webp)'), ok);
  },
});

// Health check (pour vérifier que le serveur a les bonnes routes)
app.get('/api/health', (req, res) => res.json({ ok: true, routes: ['auth', 'upload', 'destinations'] }));

// --- Auth ---
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const result = login(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
  res.json({ user: { id: payload.id, email: payload.email } });
});

// POST upload photo (protégé)
app.post('/api/upload', authMiddleware, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Fichier trop volumineux (max 10 Mo)' });
      return res.status(400).json({ error: err.message || 'Erreur upload' });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

// GET toutes les destinations
app.get('/api/destinations', (req, res) => {
  const destinations = db.prepare(`
    SELECT * FROM destinations ORDER BY created_at DESC
  `).all();

  // Récupérer photos et ratings pour chaque destination
  const result = destinations.map(d => ({
    ...d,
    regionFull: d.region_full,
    photos: db.prepare('SELECT url FROM photos WHERE destination_id = ?').all(d.id).map(p => p.url),
    ratings: db.prepare('SELECT label, value, color FROM ratings WHERE destination_id = ?').all(d.id)
  }));

  res.json(result);
});

// GET une destination par ID
app.get('/api/destinations/:id', (req, res) => {
  const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
  if (!dest) return res.status(404).json({ error: 'Not found' });

  dest.photos = db.prepare('SELECT url FROM photos WHERE destination_id = ?').all(dest.id).map(p => p.url);
  dest.ratings = db.prepare('SELECT label, value, color FROM ratings WHERE destination_id = ?').all(dest.id);
  dest.regionFull = dest.region_full;

  res.json(dest);
});

// POST créer une destination (protégé)
app.post('/api/destinations', authMiddleware, (req, res) => {
  try {
    const { id, ville, name, region, regionFull, notes, coords, photos, ratings } = req.body || {};

    if (!id || !ville || !name || !region) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        details: 'Destination, ville et région sont obligatoires',
      });
    }

    const insert = db.prepare(`
      INSERT OR REPLACE INTO destinations (id, ville, name, region, region_full, notes, coords)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, ville, name, region, regionFull || region, notes || null, coords || null);

    db.prepare('DELETE FROM photos WHERE destination_id = ?').run(id);
    const insertPhoto = db.prepare('INSERT INTO photos (destination_id, url) VALUES (?, ?)');
    (photos || []).forEach((url) => insertPhoto.run(id, url));

    db.prepare('DELETE FROM ratings WHERE destination_id = ?').run(id);
    const insertRating = db.prepare('INSERT INTO ratings (destination_id, label, value, color) VALUES (?, ?, ?, ?)');
    (ratings || []).forEach((r) => insertRating.run(id, r.label, r.value, r.color));

    res.status(201).json({ id });
  } catch (err) {
    console.error('Create destination error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

// DELETE supprimer une destination (protégé)
app.delete('/api/destinations/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const dest = db.prepare('SELECT id FROM destinations WHERE id = ?').get(id);
    if (!dest) return res.status(404).json({ error: 'Destination introuvable' });

    db.prepare('DELETE FROM photos WHERE destination_id = ?').run(id);
    db.prepare('DELETE FROM ratings WHERE destination_id = ?').run(id);
    db.prepare('DELETE FROM destinations WHERE id = ?').run(id);

    res.status(204).send();
  } catch (err) {
    console.error('Delete destination error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
