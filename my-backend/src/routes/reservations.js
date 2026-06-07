import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { activity_id, prenom, nom, email, telephone, nombre_personnes, date_reservation, message } = req.body;

  if (!activity_id || !prenom || !nom || !email || !telephone || !nombre_personnes || !date_reservation) {
    return res.status(422).json({ error: 'activity_id, prenom, nom, email, telephone, nombre_personnes, and date_reservation are required' });
  }

  const activity = db.prepare('SELECT id FROM activities WHERE id = ?').get(Number(activity_id));
  if (!activity) {
    return res.status(422).json({ error: 'Activity not found' });
  }

  const result = db.prepare(`
    INSERT INTO reservations (activity_id, prenom, nom, email, telephone, nombre_personnes, date_reservation, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(Number(activity_id), prenom, nom, email, telephone, Number(nombre_personnes), date_reservation, message || null);

  const created = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

export default router;
