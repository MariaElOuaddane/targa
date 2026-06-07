import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'targa_secret_key_2024';

function auth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.split(' ')[1], JWT_SECRET); } catch { return null; }
}

// Guide rating
router.post('/guide', (req, res) => {
  const decoded = auth(req);
  if (!decoded) return res.status(401).json({ error: 'Authentification requise' });
  const { guide_id, rating } = req.body;
  if (!guide_id || !rating || rating < 1 || rating > 5)
    return res.status(422).json({ error: 'guide_id et rating (1-5) requis' });
  try {
    db.prepare(`INSERT INTO guide_ratings (user_id, guide_id, rating) VALUES (?, ?, ?)
      ON CONFLICT(user_id, guide_id) DO UPDATE SET rating = ?`).run(decoded.id, guide_id, rating, rating);
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM guide_ratings WHERE guide_id = ?').get(guide_id);
    res.json({ success: true, average: Math.round(stats.avg * 10) / 10, count: stats.count });
  } catch { res.status(500).json({ error: 'Erreur' }); }
});

router.get('/guide/:id', (req, res) => {
  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM guide_ratings WHERE guide_id = ?').get(req.params.id);
  let userRating = null;
  const decoded = auth(req);
  if (decoded) {
    const ur = db.prepare('SELECT rating FROM guide_ratings WHERE user_id = ? AND guide_id = ?').get(decoded.id, req.params.id);
    if (ur) userRating = ur.rating;
  }
  res.json({ average: Math.round((avg.avg || 0) * 10) / 10, count: avg.count, userRating });
});

// Destination rating
router.post('/destination', (req, res) => {
  const decoded = auth(req);
  if (!decoded) return res.status(401).json({ error: 'Authentification requise' });
  const { destination_id, rating } = req.body;
  if (!destination_id || !rating || rating < 1 || rating > 5)
    return res.status(422).json({ error: 'destination_id et rating (1-5) requis' });
  try {
    db.prepare(`INSERT INTO destination_ratings (user_id, destination_id, rating) VALUES (?, ?, ?)
      ON CONFLICT(user_id, destination_id) DO UPDATE SET rating = ?`).run(decoded.id, destination_id, rating, rating);
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM destination_ratings WHERE destination_id = ?').get(destination_id);
    res.json({ success: true, average: Math.round(stats.avg * 10) / 10, count: stats.count });
  } catch { res.status(500).json({ error: 'Erreur' }); }
});

router.get('/destination/:id', (req, res) => {
  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM destination_ratings WHERE destination_id = ?').get(req.params.id);
  let userRating = null;
  const decoded = auth(req);
  if (decoded) {
    const ur = db.prepare('SELECT rating FROM destination_ratings WHERE user_id = ? AND destination_id = ?').get(decoded.id, req.params.id);
    if (ur) userRating = ur.rating;
  }
  res.json({ average: Math.round((avg.avg || 0) * 10) / 10, count: avg.count, userRating });
});

// Activity rating
router.post('/activity', (req, res) => {
  const decoded = auth(req);
  if (!decoded) return res.status(401).json({ error: 'Authentification requise' });
  const { activity_id, rating } = req.body;
  if (!activity_id || !rating || rating < 1 || rating > 5)
    return res.status(422).json({ error: 'activity_id et rating (1-5) requis' });
  try {
    db.prepare(`INSERT INTO activity_ratings (user_id, activity_id, rating) VALUES (?, ?, ?)
      ON CONFLICT(user_id, activity_id) DO UPDATE SET rating = ?`).run(decoded.id, activity_id, rating, rating);
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM activity_ratings WHERE activity_id = ?').get(activity_id);
    res.json({ success: true, average: Math.round(stats.avg * 10) / 10, count: stats.count });
  } catch { res.status(500).json({ error: 'Erreur' }); }
});

router.get('/activity/:id', (req, res) => {
  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM activity_ratings WHERE activity_id = ?').get(req.params.id);
  let userRating = null;
  const decoded = auth(req);
  if (decoded) {
    const ur = db.prepare('SELECT rating FROM activity_ratings WHERE user_id = ? AND activity_id = ?').get(decoded.id, req.params.id);
    if (ur) userRating = ur.rating;
  }
  res.json({ average: Math.round((avg.avg || 0) * 10) / 10, count: avg.count, userRating });
});

// Review likes
router.post('/review/like', (req, res) => {
  const decoded = auth(req);
  if (!decoded) return res.status(401).json({ error: 'Authentification requise' });
  const { review_id } = req.body;
  if (!review_id) return res.status(422).json({ error: 'review_id requis' });
  try {
    db.prepare(`INSERT INTO review_likes (user_id, review_id, is_like) VALUES (?, ?, 1)
      ON CONFLICT(user_id, review_id) DO UPDATE SET is_like = 1`).run(decoded.id, review_id);
    res.json({ success: true, action: 'liked' });
  } catch { res.status(500).json({ error: 'Erreur' }); }
});

router.post('/review/dislike', (req, res) => {
  const decoded = auth(req);
  if (!decoded) return res.status(401).json({ error: 'Authentification requise' });
  const { review_id } = req.body;
  if (!review_id) return res.status(422).json({ error: 'review_id requis' });
  try {
    db.prepare(`INSERT INTO review_likes (user_id, review_id, is_like) VALUES (?, ?, 0)
      ON CONFLICT(user_id, review_id) DO UPDATE SET is_like = 0`).run(decoded.id, review_id);
    res.json({ success: true, action: 'disliked' });
  } catch { res.status(500).json({ error: 'Erreur' }); }
});

router.post('/review/remove', (req, res) => {
  const decoded = auth(req);
  if (!decoded) return res.status(401).json({ error: 'Authentification requise' });
  const { review_id } = req.body;
  if (!review_id) return res.status(422).json({ error: 'review_id requis' });
  try {
    db.prepare('DELETE FROM review_likes WHERE user_id = ? AND review_id = ?').run(decoded.id, review_id);
    res.json({ success: true, action: 'removed' });
  } catch { res.status(500).json({ error: 'Erreur' }); }
});

router.get('/review/:id', (req, res) => {
  const likes = db.prepare('SELECT COUNT(*) as c FROM review_likes WHERE review_id = ? AND is_like = 1').get(req.params.id);
  const dislikes = db.prepare('SELECT COUNT(*) as c FROM review_likes WHERE review_id = ? AND is_like = 0').get(req.params.id);
  let userAction = null;
  const decoded = auth(req);
  if (decoded) {
    const ur = db.prepare('SELECT is_like FROM review_likes WHERE user_id = ? AND review_id = ?').get(decoded.id, req.params.id);
    if (ur) userAction = ur.is_like ? 'liked' : 'disliked';
  }
  res.json({ likes: likes.c, dislikes: dislikes.c, userAction });
});

export default router;
