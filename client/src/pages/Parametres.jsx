import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost, getApiOrigin } from '../lib/api.js';

/**
 * Probe states: 'probe' | 'ok' | 'error'
 * Never show OK without a completed probe.
 */
function Badge({ state }) {
  const color =
    state === 'ok' ? 'var(--jaune)'
      : state === 'probe' ? 'var(--text-muted)'
        : 'var(--rouge)';
  const label = state === 'ok' ? 'OK' : state === 'probe' ? 'probe…' : '—';
  return (
    <span
      style={{
        color,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
      }}
    >
      {label}
    </span>
  );
}

async function probeWebhook(apiOrigin) {
  if (!apiOrigin) throw new Error('VITE_API_URL manquante');
  const res = await fetch(`${apiOrigin}/api/webhooks/github`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: 'twiy-probe', message: 'parametres probe', sha: `probe-${Date.now()}` }),
  });
  // Secret required → 401 means endpoint is up and protected
  return { ok: res.status === 401, status: res.status };
}

export default function Parametres() {
  const { session } = useAuth();
  const apiOrigin = getApiOrigin();

  const [health, setHealth] = useState({ state: 'probe', detail: 'probe…' });
  const [streaks, setStreaks] = useState({ state: 'probe', detail: 'probe…', count: null });
  const [webhook, setWebhook] = useState({ state: 'probe', detail: 'probe…' });
  const [ai, setAi] = useState({ state: 'probe', detail: 'probe…', anthropic: false });
  const [msg, setMsg] = useState('');

  async function runProbes() {
    setHealth({ state: 'probe', detail: 'probe…' });
    setStreaks({ state: 'probe', detail: 'probe…', count: null });
    setWebhook({ state: 'probe', detail: 'probe…' });
    setAi({ state: 'probe', detail: 'probe…', anthropic: false });

    // /health (Express root, not under /api)
    try {
      if (!apiOrigin) throw new Error('VITE_API_URL manquante');
      const res = await fetch(`${apiOrigin}/health`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setHealth({ state: 'error', detail: `HTTP ${res.status}` });
      } else {
        setHealth({
          state: 'ok',
          detail: `${data.systeme || 'API'} · TZ ${data.tz || '?'}`,
        });
      }
    } catch (err) {
      setHealth({ state: 'error', detail: err.message || 'injoignable' });
    }

    // /streaks
    try {
      const data = await apiGet('/streaks');
      if (!Array.isArray(data)) throw new Error('réponse invalide');
      setStreaks({
        state: 'ok',
        detail: `${data.length} piste${data.length === 1 ? '' : 's'}`,
        count: data.length,
      });
    } catch (err) {
      setStreaks({ state: 'error', detail: err.message || 'échec', count: null });
    }

    // /ai/status
    try {
      const data = await apiGet('/ai/status');
      if (data?.anthropic) {
        setAi({
          state: 'ok',
          detail: `OK · ${data.model || 'claude'}`,
          anthropic: true,
        });
      } else {
        setAi({
          state: 'error',
          detail: 'ANTHROPIC_API_KEY manquante sur Railway',
          anthropic: false,
        });
      }
    } catch (err) {
      setAi({ state: 'error', detail: err.message || 'échec', anthropic: false });
    }

    // webhook probe
    try {
      const result = await probeWebhook(apiOrigin);
      if (result.ok) {
        setWebhook({ state: 'ok', detail: 'secret requis (401) · protection OK' });
      } else {
        setWebhook({ state: 'error', detail: `réponse inattendue HTTP ${result.status}` });
      }
    } catch (err) {
      setWebhook({ state: 'error', detail: err.message || 'injoignable' });
    }
  }

  useEffect(() => {
    // Auth probes (/streaks, /ai/status) need JWT — wait for session like Chantier
    if (!session) return undefined;
    runProbes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOrigin, session]);

  const connexions = useMemo(() => ([
    { nom: 'API Express', state: health.state, detail: health.detail },
    {
      nom: 'Supabase Auth',
      state: session ? 'ok' : 'error',
      detail: session?.user?.email || 'non connecté',
    },
    { nom: 'Streaks DB', state: streaks.state, detail: streaks.detail },
    { nom: 'GitHub webhook', state: webhook.state, detail: webhook.detail },
    { nom: 'Claude (Phase 3)', state: ai.state, detail: ai.detail },
  ]), [health, session, streaks, webhook, ai]);

  async function testerWebhook() {
    setWebhook({ state: 'probe', detail: 'probe…' });
    try {
      const result = await probeWebhook(apiOrigin);
      if (result.ok) {
        setWebhook({ state: 'ok', detail: 'secret requis (401) · protection OK' });
      } else {
        setWebhook({ state: 'error', detail: `réponse inattendue HTTP ${result.status}` });
      }
    } catch (err) {
      setWebhook({ state: 'error', detail: err.message || 'injoignable' });
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
    setMsg('');
    try {
      const dump = await apiGet('/export');
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `twiy-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg(err.message);
    }
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
            <Badge state={c.state} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button type="button" onClick={runProbes} className="btn-ghost">Retester tout</button>
        <button type="button" onClick={testerWebhook} className="btn-ghost">Retester webhook</button>
        <button type="button" onClick={routinesJour} className="btn-ghost" disabled={!ai.anthropic}>
          Routines du jour
        </button>
        <button type="button" onClick={exporter} className="btn-poster">Exporter JSON</button>
      </div>
      {msg && <p className="compteur" style={{ marginTop: 12 }}>{msg}</p>}

      <p className="compteur" style={{ marginTop: 'var(--space-4)' }}>
        Phase 3 : docs/phase-3.md · n8n/ · ANTHROPIC_API_KEY sur Railway
      </p>
    </div>
  );
}
