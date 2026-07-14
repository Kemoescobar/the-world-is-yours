import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiGet } from '../lib/api.js';

const rawApi = (import.meta.env.VITE_API_URL || '').trim();
const API_URL = rawApi && !/^https?:\/\//i.test(rawApi) ? `https://${rawApi}` : rawApi;

export default function Parametres() {
  const { session } = useAuth();
  const [health, setHealth] = useState(null);
  const [streaks, setStreaks] = useState([]);
  const [webhookOk, setWebhookOk] = useState(null);

  useEffect(() => {
    fetch(`${API_URL.replace(/\/api$/, '')}/health`).then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false }));
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
  }, []);

  const connexions = useMemo(() => ([
    { nom: 'API Express', ok: !!health?.ok, detail: `${health?.systeme || 'offline'} · TZ ${health?.tz || '?'}` },
    { nom: 'Supabase Auth', ok: !!session, detail: session?.user?.email || 'non connecté' },
    { nom: 'Streaks DB', ok: streaks.length > 0, detail: `${streaks.length} pistes` },
    { nom: 'GitHub webhook', ok: webhookOk === true, detail: webhookOk == null ? 'non testé' : webhookOk ? 'secret OK' : 'échec' },
  ]), [health, session, streaks, webhookOk]);

  async function testerWebhook() {
    const res = await fetch(`${API_URL}/webhooks/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: 'test', message: 'probe', sha: '0000000' }),
    });
    setWebhookOk(res.status === 401);
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
          <div key={c.nom} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p>{c.nom}</p>
              <p className="compteur">{c.detail}</p>
            </div>
            <span style={{ color: c.ok ? 'var(--jaune)' : 'var(--rouge)', fontFamily: 'var(--font-mono)' }}>
              {c.ok ? 'OK' : '—'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button type="button" onClick={testerWebhook}
          style={{ padding: '10px 14px', borderRadius: 4, border: '1px solid var(--bg-3)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
          Tester protection webhook
        </button>
        <button type="button" onClick={exporter}
          style={{ padding: '10px 14px', borderRadius: 4, border: 'none', background: 'var(--jaune)', color: '#060a1a', fontWeight: 700, cursor: 'pointer' }}>
          Exporter JSON
        </button>
      </div>

      <p className="compteur" style={{ marginTop: 'var(--space-4)' }}>
        Phase 0 : JWT requis sur l’API privée. Voir docs/github-webhook.md pour GitHub.
      </p>
    </div>
  );
}
