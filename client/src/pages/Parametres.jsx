import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost } from '../lib/api.js';

const rawApi = (import.meta.env.VITE_API_URL || '').trim();
const API_URL = rawApi && !/^https?:\/\//i.test(rawApi) ? `https://${rawApi}` : rawApi;

async function probeWebhook() {
  const res = await fetch(`${API_URL}/webhooks/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: 'twiy-probe', message: 'parametres probe', sha: `probe-${Date.now()}` }),
  });
  return res.status === 401;
}

export default function Parametres() {
  const { session } = useAuth();
  const [health, setHealth] = useState(null);
  const [streaks, setStreaks] = useState([]);
  const [webhookOk, setWebhookOk] = useState(null);
  const [webhookDetail, setWebhookDetail] = useState('probe…');
  const [ai, setAi] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API_URL.replace(/\/api$/, '')}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
    apiGet('/ai/status').then(setAi).catch(() => setAi({ anthropic: false }));
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
    {
      nom: 'Claude (Phase 3)',
      ok: !!ai?.anthropic,
      detail: ai?.anthropic ? `OK · ${ai.model}` : 'ANTHROPIC_API_KEY manquante sur Railway',
    },
  ]), [health, session, streaks, webhookOk, webhookDetail, ai]);

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

  async function routinesJour() {
    setMsg('');
    try {
      const data = await apiPost('/ai/routines-jour', {});
      setMsg(`${data.creees?.length || 0} routine(s) créées pour ${data.jour}`);
    } catch (err) {
      setMsg(err.message);
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
    <div className="os-page" style={{ maxWidth: 720 }}>
      <OsHeader
        kicker="OS · PARAMÈTRES"
        title="PARAMÈTRES"
        meta="Connexions · IA · Export"
      />

      <div className="os-stack">
        {connexions.map((c) => (
          <div key={c.nom} className="os-row blueprint-grid">
            <div>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {c.nom}
              </p>
              <p className="compteur" style={{ marginTop: 6 }}>{c.detail}</p>
            </div>
            <span
              style={{
                color: c.ok ? 'var(--jaune)' : (c.detail === 'probe…' ? 'var(--text-muted)' : 'var(--rouge)'),
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
              }}
            >
              {c.detail === 'probe…' ? '…' : (c.ok ? 'OK' : '—')}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button type="button" onClick={testerWebhook} className="btn-ghost">Retester webhook</button>
        <button type="button" onClick={routinesJour} className="btn-ghost">Routines du jour</button>
        <button type="button" onClick={exporter} className="btn-poster">Exporter JSON</button>
      </div>
      {msg && <p className="compteur" style={{ marginTop: 12 }}>{msg}</p>}

      <p className="compteur" style={{ marginTop: 'var(--space-4)' }}>
        Phase 3 : docs/phase-3.md · n8n/ · ANTHROPIC_API_KEY sur Railway
      </p>
    </div>
  );
}
