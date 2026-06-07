import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'targa_secret_key_2024';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'Accès refusé — droits admin requis' });
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

router.use(requireAdmin);

// Dashboard stats
router.get('/stats', (_req, res) => {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get();
  const guides = db.prepare('SELECT COUNT(*) as c FROM guides').get();
  const activities = db.prepare('SELECT COUNT(*) as c FROM activities').get();
  const reservations = db.prepare('SELECT COUNT(*) as c FROM reservations').get();
  const reviews = db.prepare('SELECT COUNT(*) as c FROM evaluations').get();
  const destinations = db.prepare('SELECT COUNT(*) as c FROM destinations').get();
  const pendingRes = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE statut = 'en_attente'").get();
  res.json({
    users: users.c, guides: guides.c, activities: activities.c,
    reservations: reservations.c, reviews: reviews.c, destinations: destinations.c,
    pendingReservations: pendingRes.c
  });
});

// Users management
router.get('/users', (req, res) => {
  const { role, search } = req.query;
  let sql = 'SELECT id, prenom, nom, email, role, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (search) { sql += ' AND (prenom || \' \' || nom LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user', 'guide'].includes(role))
    return res.status(422).json({ error: 'Rôle invalide' });
  db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, req.params.id);
  res.json({ success: true });
});

router.post('/users', (req, res) => {
  const { prenom, nom, email, password, role } = req.body;
  if (!prenom || !nom || !email || !password) return res.status(422).json({ error: 'prenom, nom, email, password requis' });
  const validRoles = ['admin', 'user', 'guide'];
  if (role && !validRoles.includes(role)) return res.status(422).json({ error: 'Rôle invalide' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (prenom, nom, email, password, role) VALUES (?,?,?,?,?)').run(prenom, nom, email, hash, role || 'user');
    if (role === 'guide') {
      db.prepare('INSERT INTO guides (prenom, nom, user_id) VALUES (?,?,?)').run(prenom, nom, result.lastInsertRowid);
    }
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email déjà utilisé' });
    throw e;
  }
});

router.put('/users/:id', (req, res) => {
  const { prenom, nom, email, role } = req.body;
  if (!prenom || !nom || !email) return res.status(422).json({ error: 'prenom, nom, email requis' });
  const validRoles = ['admin', 'user', 'guide'];
  if (role && !validRoles.includes(role)) return res.status(422).json({ error: 'Rôle invalide' });
  try {
    db.prepare('UPDATE users SET prenom=?, nom=?, email=?, role=?, updated_at=datetime(\'now\') WHERE id=?').run(prenom, nom, email, role, req.params.id);
    res.json({ success: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email déjà utilisé' });
    throw e;
  }
});

router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM reservations WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM evaluations WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM guide_ratings WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM activity_ratings WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM destination_ratings WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM review_likes WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM guides WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Guides management
router.get('/guides', (_req, res) => {
  res.json(db.prepare('SELECT * FROM guides ORDER BY nom').all());
});

router.post('/guides', (req, res) => {
  const { nom, prenom, ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp } = req.body;
  if (!nom || !prenom) return res.status(422).json({ error: 'nom, prenom requis' });
  const result = db.prepare('INSERT INTO guides (nom, prenom, ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(nom, prenom, ville||null, telephone||null, langues||null, specialite||null, description||null, instagram||null, linkedin||null, whatsapp||null);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/guides/:id', (req, res) => {
  const { nom, prenom, ville, telephone, langues, specialite, description, instagram, linkedin, whatsapp } = req.body;
  db.prepare(`UPDATE guides SET nom=?, prenom=?, ville=?, telephone=?, langues=?, specialite=?, description=?, instagram=?, linkedin=?, whatsapp=?, updated_at=datetime('now') WHERE id=?`)
    .run(nom, prenom, ville, telephone, langues, specialite, description, instagram||null, linkedin||null, whatsapp||null, req.params.id);
  res.json({ success: true });
});

router.delete('/guides/:id', (req, res) => {
  db.prepare('DELETE FROM guide_ratings WHERE guide_id = ?').run(req.params.id);
  db.prepare('DELETE FROM guides WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Activities management
router.get('/activities', (_req, res) => {
  res.json(db.prepare('SELECT a.*, d.nom as destination_nom FROM activities a LEFT JOIN destinations d ON a.destination_slug = d.slug ORDER BY a.created_at DESC').all());
});

router.post('/activities', (req, res) => {
  const { titre, description, prix, categorie, destination_slug, ville } = req.body;
  if (!titre || !description || !prix) return res.status(422).json({ error: 'titre, description, prix requis' });
  const result = db.prepare('INSERT INTO activities (titre, description, prix, categorie, destination_slug, ville) VALUES (?,?,?,?,?,?)')
    .run(titre, description, prix, categorie || null, destination_slug || null, ville || null);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/activities/:id', (req, res) => {
  const { titre, description, prix, categorie, destination_slug, ville } = req.body;
  db.prepare(`UPDATE activities SET titre=?, description=?, prix=?, categorie=?, destination_slug=?, ville=?, updated_at=datetime('now') WHERE id=?`)
    .run(titre, description, prix, categorie || null, destination_slug || null, ville || null, req.params.id);
  res.json({ success: true });
});

router.delete('/activities/:id', (req, res) => {
  db.prepare('DELETE FROM activity_ratings WHERE activity_id = ?').run(req.params.id);
  db.prepare('DELETE FROM reservations WHERE activity_id = ?').run(req.params.id);
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Reservations management
router.get('/reservations', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT r.*, a.titre as activity_titre FROM reservations r LEFT JOIN activities a ON r.activity_id = a.id';
  const params = [];
  if (status && status !== 'all') { sql += ' WHERE r.statut = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.put('/reservations/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['en_attente', 'confirmé', 'annulé'].includes(status))
    return res.status(422).json({ error: 'Statut invalide' });
  db.prepare('UPDATE reservations SET statut = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Reviews management
router.get('/reviews', (_req, res) => {
  res.json(db.prepare('SELECT e.*, COALESCE(l.likes,0) as likes, COALESCE(d.dislikes,0) as dislikes FROM evaluations e LEFT JOIN (SELECT review_id, COUNT(*) as likes FROM review_likes WHERE is_like=1 GROUP BY review_id) l ON e.id=l.review_id LEFT JOIN (SELECT review_id, COUNT(*) as dislikes FROM review_likes WHERE is_like=0 GROUP BY review_id) d ON e.id=d.review_id ORDER BY e.created_at DESC').all());
});

router.delete('/reviews/:id', (req, res) => {
  db.prepare('DELETE FROM evaluations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Logs (simple activity tracking)
router.get('/logs', (_req, res) => {
  const logs = [
    { action: 'Connexion admin', user: 'Admin', time: new Date().toISOString(), icon: '🔐' },
    { action: `${db.prepare('SELECT COUNT(*) as c FROM users').get().c} utilisateurs enregistrés`, user: 'Système', time: new Date(Date.now() - 3600000).toISOString(), icon: '👤' },
    { action: `${db.prepare('SELECT COUNT(*) as c FROM reservations WHERE statut = \'en_attente\'').get().c} réservations en attente`, user: 'Système', time: new Date(Date.now() - 7200000).toISOString(), icon: '✅' },
  ];
  res.json(logs);
});

export default router;
