import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiGet } from '../lib/api.js';

const rawApi = (import.meta.env.VITE_API_URL || '').trim();
const API_URL = rawApi && !/^https?:\/\//i.test(rawApi) ? `https://${rawApi}` : rawApi;

async function probeWebhook() {
  const res = await fetch(`${API_URL}/webhooks/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: 'twiy-probe', message: 'parametres probe', sha: `probe-${Date.now()}` }),
  });
  // Sans secret → 401 = protection active (comportement attendu)
  return res.status === 401;
}

export default function Parametres() {
  const { session } = useAuth();
  const [health, setHealth] = useState(null);
  const [streaks, setStreaks] = useState([]);
  const [webhookOk, setWebhookOk] = useState(null);
  const [webhookDetail, setWebhookDetail] = useState('probe…');

  useEffect(() => {
    fetch(`${API_URL.replace(/\/api$/, '')}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
    probeWebhook()
      .then((ok) => {
        setWebhookOk(ok);
        setWebhookDetail(ok ? 'secret requis (401) · protection OK' : 'réponse inattendue');
      })
      .catch(() => {
        setWebhookOk(false);
        setWebhookDetail('injoignable');
      });
  }, []);

  const connexions = useMemo(() => ([
    { nom: 'API Express', ok: !!health?.ok, detail: `${health?.systeme || 'offline'} · TZ ${health?.tz || '?'}` },
    { nom: 'Supabase Auth', ok: !!session, detail: session?.user?.email || 'non connecté' },
    { nom: 'Streaks DB', ok: streaks.length > 0, detail: `${streaks.length} pistes` },
    {
      nom: 'GitHub webhook',
      ok: webhookOk === true,
      detail: webhookOk == null ? webhookDetail : webhookOk ? webhookDetail : webhookDetail || 'échec',
    },
  ]), [health, session, streaks, webhookOk, webhookDetail]);

  async function testerWebhook() {
    setWebhookOk(null);
    setWebhookDetail('probe…');
    try {
      const ok = await probeWebhook();
      setWebhookOk(ok);
      setWebhookDetail(ok ? 'secret requis (401) · protection OK' : 'réponse inattendue');
    } catch {
      setWebhookOk(false);
      setWebhookDetail('injoignable');
    }
  }

  async function exporter() {
    const dump = await apiGet('/export');
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twiy-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 720 }}>
      <h1>Paramètres</h1>
      <p className="compteur" style={{ marginTop: 8 }}>Connexions · Export · Webhook</p>

      <div style={{ display: 'grid', gap: 10, marginTop: 'var(--space-4)' }}>
        {connexions.map((c) => (
          <div
            key={c.nom}
            className="poster-panel blueprint-grid"
            style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', gap: 12 }}
          >
            <div>
              <p style={{ margin: 0 }}>{c.nom}</p>
              <p className="compteur" style={{ marginTop: 6 }}>{c.detail}</p>
            </div>
            <span style={{
              color: c.ok ? 'var(--jaune)' : (c.detail === 'probe…' ? 'var(--text-muted)' : 'var(--rouge)'),
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              alignSelf: 'center',
            }}>
              {c.detail === 'probe…' ? '…' : (c.ok ? 'OK' : '—')}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button type="button" onClick={testerWebhook} className="btn-ghost">
          Retester webhook
        </button>
        <button type="button" onClick={exporter} className="btn-poster">
          Exporter JSON
        </button>
      </div>

      <p className="compteur" style={{ marginTop: 'var(--space-4)' }}>
        Probe sans secret = 401 attendu. Push GitHub réel → Chroniques. Voir docs/github-webhook.md
      </p>
    </div>
  );
}
