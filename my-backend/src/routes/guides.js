import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM guides ORDER BY nom').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM guides WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Guide not found' });
  res.json(row);
});

export default router;
