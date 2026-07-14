const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

export function anthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Appel Messages API Anthropic (fetch natif).
 * @param {string} system
 * @param {string} user
 * @param {number} [maxTokens]
 */
export async function askClaude(system, user, maxTokens = 900) {
  if (!anthropicConfigured()) {
    const err = new Error('ANTHROPIC_API_KEY manquante — renseigne-la sur Railway / server/.env');
    err.code = 'NO_KEY';
    throw err;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || res.statusText || 'erreur Anthropic';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const text = (body.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return { text, raw: body, model: MODEL };
}
