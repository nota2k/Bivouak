// server/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

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

// POST créer une destination
app.post('/api/destinations', (req, res) => {
  const { id, ville, name, region, regionFull, notes, coords, photos, ratings } = req.body;

  const insert = db.prepare(`
    INSERT INTO destinations (id, ville, name, region, region_full, notes, coords)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(id, ville, name, region, regionFull, notes, coords);

  const insertPhoto = db.prepare('INSERT INTO photos (destination_id, url) VALUES (?, ?)');
  photos?.forEach(url => insertPhoto.run(id, url));

  const insertRating = db.prepare('INSERT INTO ratings (destination_id, label, value, color) VALUES (?, ?, ?, ?)');
  ratings?.forEach(r => insertRating.run(id, r.label, r.value, r.color));

  res.status(201).json({ id });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
