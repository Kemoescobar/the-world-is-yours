/**
 * Client Anthropic — DÉBRANCHÉ (Cerveau Claude = directives Cowork).
 * Conservé pour ne pas casser les imports ; aucun appel réseau sortant.
 */

/** Toujours false — plus de génération LLM à la requête. */
export function anthropicConfigured() {
  return false;
}

/**
 * No-op : lève NO_KEY. Utiliser POST /api/directives (Cowork).
 * @param {string} [_system]
 * @param {string} [_user]
 * @param {number} [_maxTokens]
 */
export async function askClaude(_system, _user, _maxTokens = 900) {
  const err = new Error('LLM débranché — écrire une directive via POST /api/directives (Cowork)');
  err.code = 'NO_KEY';
  throw err;
}
