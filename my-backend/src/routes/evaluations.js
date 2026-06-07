import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT e.*,
      COALESCE(l.c, 0) as likes,
      COALESCE(d.c, 0) as dislikes
    FROM evaluations e
    LEFT JOIN (SELECT review_id, COUNT(*) as c FROM review_likes WHERE is_like = 1 GROUP BY review_id) l ON e.id = l.review_id
    LEFT JOIN (SELECT review_id, COUNT(*) as c FROM review_likes WHERE is_like = 0 GROUP BY review_id) d ON e.id = d.review_id
    ORDER BY e.created_at DESC
  `).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { auteur_prenom, auteur_nom, commentaire, destination, user_id } = req.body;

  if (!auteur_prenom || !auteur_nom || !commentaire) {
    return res.status(422).json({ error: 'auteur_prenom, auteur_nom and commentaire are required' });
  }

  const result = db.prepare(`
    INSERT INTO evaluations (auteur_prenom, auteur_nom, commentaire, destination, user_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(auteur_prenom, auteur_nom, commentaire, destination || null, user_id || null);

  const created = db.prepare(`
    SELECT e.*,
      COALESCE(l.c, 0) as likes,
      COALESCE(d.c, 0) as dislikes
    FROM evaluations e
    LEFT JOIN (SELECT review_id, COUNT(*) as c FROM review_likes WHERE is_like = 1 GROUP BY review_id) l ON e.id = l.review_id
    LEFT JOIN (SELECT review_id, COUNT(*) as c FROM review_likes WHERE is_like = 0 GROUP BY review_id) d ON e.id = d.review_id
    WHERE e.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(created);
});

export default router;
