// server/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

const db = new sqlite3.Database(path.join(__dirname, 'bivouak.db'));

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
const exec = promisify(db.exec.bind(db));

// Créer les tables
const initSchema = async () => {
  await exec(`
    CREATE TABLE IF NOT EXISTS destinations (
      id TEXT PRIMARY KEY,
      ville TEXT NOT NULL,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      region_full TEXT NOT NULL,
      notes TEXT,
      coords TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id TEXT NOT NULL,
      url TEXT NOT NULL,
      FOREIGN KEY (destination_id) REFERENCES destinations(id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      color TEXT NOT NULL,
      FOREIGN KEY (destination_id) REFERENCES destinations(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Données initiales
const seedData = [
  {
    id: 'serre-poncon',
    ville: 'Lac de Serre-Ponçon',
    name: 'LAC DE\nSERRE-PONÇON',
    region: 'HAUTES-ALPES, FRANCE',
    regionFull: 'Hautes-Alpes, France',
    notes: "Spot exceptionnel en surplomb du lac, accessible par une piste forestière bien entretenue. Arrivée idéale en fin d'après-midi pour profiter du coucher de soleil sur les montagnes. Le calme est absolu une fois la nuit tombée. Attention au vent qui peut souffler fort sur les crêtes. Aucun point d'eau à proximité — prévoir le ravitaillement avant la montée.",
    coords: '44.4833° N, 6.3333° E',
    photos: [
      'https://images.unsplash.com/photo-1765115407700-4ddf15875935?w=1920&q=80',
      'https://images.unsplash.com/photo-1648564626497-fbc3f8b2b827?w=1920&q=80',
      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1920&q=80',
    ],
    ratings: [
      { label: 'VUE', value: '9.2', color: '#C2956A' },
      { label: 'CALME', value: '8.5', color: '#A38979' },
      { label: 'ACCÈS', value: '7.0', color: '#8F5A3C' },
      { label: 'GLOBAL', value: '8.4', color: '#1A1A1A' },
    ],
  },
  {
    id: 'gorges-du-verdon',
    ville: 'Gorges du Verdon',
    name: 'GORGES\nDU VERDON',
    region: 'PROVENCE, FRANCE',
    regionFull: "Provence-Alpes-Côte d'Azur, France",
    notes: "Les falaises du Verdon offrent des points de vue spectaculaires. Bivouac possible sur les plateaux en bord de falaise. Réveil magique au-dessus des eaux turquoise. Piste en terre pour accéder au spot — véhicule avec garde au sol recommandé. Eau disponible au village le plus proche à 15 min.",
    coords: '43.7167° N, 6.3833° E',
    photos: [
      'https://images.unsplash.com/photo-1613139711686-b5366834be37?w=1920&q=80',
      'https://images.unsplash.com/photo-1725522355814-5686fa611a63?w=1920&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    ],
    ratings: [
      { label: 'VUE', value: '9.8', color: '#C2956A' },
      { label: 'CALME', value: '7.5', color: '#A38979' },
      { label: 'ACCÈS', value: '6.5', color: '#8F5A3C' },
      { label: 'GLOBAL', value: '8.2', color: '#1A1A1A' },
    ],
  },
  {
    id: 'cap-corse',
    ville: 'Cap Corse',
    name: 'CAP CORSE',
    region: 'CORSE, FRANCE',
    regionFull: 'Haute-Corse, France',
    notes: "La pointe nord de la Corse réserve des panoramas à couper le souffle. Bivouac face à la mer, entre maquis et rochers. Idéal pour les aurores. Accès par sentier côtier — prévoir 30 min de marche depuis le parking. Pas d'eau sur place.",
    coords: '42.9833° N, 9.4500° E',
    photos: [
      'https://images.unsplash.com/photo-1766167258852-81a8496366bb?w=1920&q=80',
      'https://images.unsplash.com/photo-1762443547470-9c02c7d35e7f?w=1920&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    ],
    ratings: [
      { label: 'VUE', value: '9.5', color: '#C2956A' },
      { label: 'CALME', value: '9.0', color: '#A38979' },
      { label: 'ACCÈS', value: '6.0', color: '#8F5A3C' },
      { label: 'GLOBAL', value: '8.3', color: '#1A1A1A' },
    ],
  },
];

const seed = async () => {
  const bcrypt = require('bcrypt');
  const insertDest = (id, ville, name, region, regionFull, notes, coords) =>
    run(
      `INSERT OR IGNORE INTO destinations (id, ville, name, region, region_full, notes, coords)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, ville, name, region, regionFull, notes, coords]
    );
  const insertPhoto = (destinationId, url) =>
    run('INSERT INTO photos (destination_id, url) VALUES (?, ?)', [destinationId, url]);
  const insertRating = (destinationId, label, value, color) =>
    run('INSERT INTO ratings (destination_id, label, value, color) VALUES (?, ?, ?, ?)', [
      destinationId,
      label,
      value,
      color,
    ]);

  for (const d of seedData) {
    const result = await insertDest(d.id, d.ville, d.name, d.region, d.regionFull, d.notes, d.coords);
    if (result.changes > 0) {
      for (const url of d.photos) await insertPhoto(d.id, url);
      for (const r of d.ratings) await insertRating(d.id, r.label, r.value, r.color);
    }
  }

  const insertUser = (email, passwordHash) =>
    run('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash]);
  const hash = bcrypt.hashSync('admin123', 10);
  await insertUser('admin@bivouak.fr', hash);
};

const init = async () => {
  await initSchema();
  await seed();
};

// API compatible avec l'ancien usage (db.prepare().run/get/all)
const dbApi = {
  run: (sql, ...params) => run(sql, params),
  get: (sql, ...params) => get(sql, params),
  all: (sql, ...params) => all(sql, params),
  init,
};

module.exports = dbApi;
