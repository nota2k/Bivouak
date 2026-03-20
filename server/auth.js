const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'bivouak-secret-dev';
const JWT_EXPIRES = '7d';

function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { token, user: { id: user.id, email: user.email } };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
  req.user = payload;
  next();
}

module.exports = { login, verifyToken, authMiddleware };
