import express from 'express';
import cors from 'cors';

import destinationsRouter from './routes/destinations.js';
import activitiesRouter from './routes/activities.js';
import guidesRouter from './routes/guides.js';
import evaluationsRouter from './routes/evaluations.js';
import reservationsRouter from './routes/reservations.js';
import authRouter from './routes/auth.js';
import ratingsRouter from './routes/ratings.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/destinations', destinationsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/admin', adminRouter);

app.get('/api', (_req, res) => {
  res.json({ message: 'TARGA API v1 — Node.js/Express' });
});

app.listen(PORT, () => {
  console.log(`TARGA API running on http://localhost:${PORT}`);
});
