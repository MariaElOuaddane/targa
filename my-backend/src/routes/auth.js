import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'targa_secret_key_2024';

router.post('/register', (req, res) => {
  const { prenom, nom, email, password, role, ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp } = req.body;

  if (!prenom || !nom || !email || !password) {
    return res.status(422).json({ error: 'prenom, nom, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(422).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const userRole = role === 'guide' || role === 'admin' ? role : 'user';
  const result = db.prepare(
    'INSERT INTO users (prenom, nom, email, password, role) VALUES (?, ?, ?, ?, ?)'
  ).run(prenom, nom, email, hashed, userRole);

  const userId = result.lastInsertRowid;

  if (userRole === 'guide') {
    db.prepare(
      `INSERT INTO guides (prenom, nom, ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(prenom, nom, ville || '', telephone || '', langues || '', specialite || '', description || '', instagram || null, linkedin || null, whatsapp || null, userId);
  }

  const user = db.prepare('SELECT id, prenom, nom, email, role, created_at FROM users WHERE id = ?').get(userId);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

router.get('/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = db.prepare('SELECT id, prenom, nom, email, role, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    let guideInfo = null;
    if (user.role === 'guide') {
      guideInfo = db.prepare('SELECT ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp FROM guides WHERE user_id = ?').get(user.id);
    }
    res.json({ ...user, guide: guideInfo });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
