import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM destinations ORDER BY nom').all();
  res.json(rows);
});

router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM destinations WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Destination not found' });
  res.json(row);
});

export default router;
