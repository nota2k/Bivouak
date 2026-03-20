// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
const { login, verifyToken, authMiddleware } = require('./auth');

const app = express();

const startServer = async () => {
  await db.init();

  app.use(cors());
  app.use(express.json());

  // ========================
  // Uploads
  // ========================
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

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
      const ok = /^image\/(jpeg|png|gif|webp|heic|heif)$/i.test(file.mimetype);
      cb(ok ? null : new Error('Format non supporté (jpg, png, gif, webp, heic)'), ok);
    },
  });

  // ========================
  // API
  // ========================

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      const result = await login(email, password);
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

  app.post('/api/upload', authMiddleware, (req, res) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Fichier trop volumineux (max 10 Mo)' });
        }
        return res.status(400).json({ error: err.message || 'Erreur upload' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier' });
      }

      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      res.json({ url });
    });
  });

  app.get('/api/destinations', async (req, res) => {
    try {
      const destinations = await db.all(`SELECT * FROM destinations ORDER BY created_at DESC`);

      const result = await Promise.all(
        destinations.map(async (d) => ({
          ...d,
          regionFull: d.region_full,
          photos: (await db.all('SELECT url FROM photos WHERE destination_id = ?', d.id)).map((p) => p.url),
          ratings: await db.all('SELECT label, value, color FROM ratings WHERE destination_id = ?', d.id),
        }))
      );

      res.json(result);
    } catch (err) {
      console.error('Get destinations error:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/destinations/:id', async (req, res) => {
    try {
      const dest = await db.get('SELECT * FROM destinations WHERE id = ?', req.params.id);
      if (!dest) return res.status(404).json({ error: 'Not found' });

      dest.photos = (await db.all('SELECT url FROM photos WHERE destination_id = ?', dest.id)).map((p) => p.url);
      dest.ratings = await db.all('SELECT label, value, color FROM ratings WHERE destination_id = ?', dest.id);
      dest.regionFull = dest.region_full;

      res.json(dest);
    } catch (err) {
      console.error('Get destination error:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/destinations', authMiddleware, async (req, res) => {
    try {
      const { id, ville, name, region, regionFull, notes, coords, photos, ratings } = req.body || {};

      if (!id || !ville || !name || !region) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }

      await db.run(
        `INSERT OR REPLACE INTO destinations (id, ville, name, region, region_full, notes, coords)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        ville,
        name,
        region,
        regionFull || region,
        notes || null,
        coords || null
      );

      await db.run('DELETE FROM photos WHERE destination_id = ?', id);
      for (const url of (photos || []).slice(0, 5)) {
        await db.run('INSERT INTO photos (destination_id, url) VALUES (?, ?)', id, url);
      }

      await db.run('DELETE FROM ratings WHERE destination_id = ?', id);
      for (const r of ratings || []) {
        await db.run(
          'INSERT INTO ratings (destination_id, label, value, color) VALUES (?, ?, ?, ?)',
          id,
          r.label,
          r.value,
          r.color
        );
      }

      res.status(201).json({ id });
    } catch (err) {
      console.error('Create destination error:', err);
      res.status(500).json({ error: err.message || 'Erreur serveur' });
    }
  });

  app.delete('/api/destinations/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      const dest = await db.get('SELECT id FROM destinations WHERE id = ?', id);
      if (!dest) return res.status(404).json({ error: 'Destination introuvable' });

      await db.run('DELETE FROM photos WHERE destination_id = ?', id);
      await db.run('DELETE FROM ratings WHERE destination_id = ?', id);
      await db.run('DELETE FROM destinations WHERE id = ?', id);

      res.status(204).send();
    } catch (err) {
      console.error('Delete destination error:', err);
      res.status(500).json({ error: err.message || 'Erreur serveur' });
    }
  });

  // ========================
  // Angular (FRONT)
  // ========================
  const distPath = path.join(__dirname, '..', 'dist', 'Bivouak', 'browser');

  app.use(express.static(distPath, {
    maxAge: '1y',
    index: false,
  }));

  app.get('/{*path}', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // ========================
  // START
  // ========================
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
