import express from 'express';
import crypto from 'crypto';
import { supabase } from '../supabaseClient.js';
import { incrementerStreak } from './streaks.js';
import { validateBody } from '../middleware/validate.js';
import { webhookEntreeSchema } from '../schemas.js';

const router = express.Router();

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifierCleApi(req, res, next) {
  const cle = req.header('x-api-key');
  if (!timingSafeEqualString(cle || '', process.env.WEBHOOK_API_KEY || '')) {
    return res.status(401).json({ error: 'clé API invalide ou absente' });
  }
  next();
}

function verifierSecretGithub(req) {
  const attendu = process.env.GITHUB_WEBHOOK_SECRET;
  if (!attendu) return false;

  const headerSecret = req.header('x-webhook-secret');
  if (headerSecret && timingSafeEqualString(headerSecret, attendu)) return true;

  const sig = req.header('x-hub-signature-256');
  if (sig && req.rawBody) {
    const digest = 'sha256=' + crypto.createHmac('sha256', attendu).update(req.rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
    } catch {
      return false;
    }
  }
  return false;
}

async function creerEntreeCommit({ repo, message, sha }) {
  const sourceRef = sha ? `github:${sha}` : null;

  if (sourceRef) {
    const { data: existing } = await supabase
      .from('entrees')
      .select('*')
      .eq('source', 'github')
      .eq('source_ref', sourceRef)
      .maybeSingle();
    if (existing) return { data: existing, deduped: true };
  }

  const { data, error } = await supabase
    .from('entrees')
    .insert({
      arc_id: 'dev',
      type_fait: 'commit',
      detail: `${repo}: ${message} (${String(sha || '').slice(0, 7)})`,
      source: 'github',
      source_ref: sourceRef,
    })
    .select()
    .single();

  if (error) {
    // Race unique index → traiter comme dédup
    if (error.code === '23505' && sourceRef) {
      const { data: again } = await supabase
        .from('entrees')
        .select('*')
        .eq('source_ref', sourceRef)
        .maybeSingle();
      if (again) return { data: again, deduped: true };
    }
    throw new Error(error.message);
  }

  await incrementerStreak('dev');
  return { data, deduped: false };
}

router.post('/entree', verifierCleApi, validateBody(webhookEntreeSchema), async (req, res) => {
  const { arc_id, type_fait, detail, source } = req.body;

  const { data, error } = await supabase
    .from('entrees')
    .insert({ arc_id: arc_id || null, type_fait, detail, source: source || 'webhook' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const streakParArc = { dev: 'dev', beatmaker: 'miprod' };
  if (type_fait === 'sport') await incrementerStreak('sport');
  else if (streakParArc[arc_id]) await incrementerStreak(streakParArc[arc_id]);

  res.status(201).json(data);
});

router.post('/webhooks/github', async (req, res) => {
  if (!verifierSecretGithub(req)) {
    return res.status(401).json({ error: 'secret invalide' });
  }

  try {
    if (req.body?.repo || req.body?.message) {
      const result = await creerEntreeCommit({
        repo: req.body.repo || 'unknown',
        message: req.body.message || 'commit',
        sha: req.body.sha,
      });
      return res.status(result.deduped ? 200 : 201).json(result.data);
    }

    const commits = req.body?.commits || [];
    const repo = req.body?.repository?.full_name || 'unknown';
    if (!commits.length) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const created = [];
    for (const c of commits) {
      const result = await creerEntreeCommit({
        repo,
        message: c.message?.split('\n')[0] || 'commit',
        sha: c.id,
      });
      created.push(result.data);
    }
    res.status(201).json({ count: created.length, entrees: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
