import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import arcsRouter from './routes/arcs.js';
import chapitresRouter from './routes/chapitres.js';
import quetesRouter from './routes/quetes.js';
import entreesRouter from './routes/entrees.js';
import streaksRouter from './routes/streaks.js';
import instrumentauxRouter from './routes/instrumentaux.js';
import projetsRouter from './routes/projets.js';
import prospectsRouter from './routes/prospects.js';
import webhooksRouter from './routes/webhooks.js';
import portefeuilleRouter from './routes/portefeuille.js';
import exportRouter from './routes/export.js';
import aiRouter from './routes/ai.js';

const app = express();

// Railway / reverse-proxy — IP réelle pour le rate limiting
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Autoriser tools sans Origin (curl, webhooks) + origines whitelistées
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS bloqué: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use('/api/arcs', arcsRouter);
app.use('/api/chapitres', chapitresRouter);
app.use('/api/quetes', quetesRouter);
app.use('/api/entrees', entreesRouter);
app.use('/api/streaks', streaksRouter);
app.use('/api/instrumentaux', instrumentauxRouter);
app.use('/api/projets', projetsRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/portefeuille', portefeuilleRouter);
app.use('/api', webhooksRouter);
app.use('/api/export', exportRouter);
app.use('/api/ai', aiRouter);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    systeme: 'THE WORLD IS YOURS',
    health: '/health',
    api: '/api',
  });
});

app.get('/health', async (req, res) => {
  res.json({
    ok: true,
    systeme: 'THE WORLD IS YOURS',
    tz: process.env.TZ || 'Indian/Antananarivo',
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server up on :${port} (TZ=${process.env.TZ || 'Indian/Antananarivo'})`);
});
