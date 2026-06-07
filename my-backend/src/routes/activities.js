import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { destination_slug } = req.query;
  let rows;
  if (destination_slug) {
    rows = db.prepare('SELECT * FROM activities WHERE destination_slug = ? ORDER BY titre').all(destination_slug);
  } else {
    rows = db.prepare('SELECT * FROM activities ORDER BY titre').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM activities WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Activity not found' });
  res.json(row);
});

export default router;
