/**
 * PréventIA Protect — Webhooks Configuration
 * ════════════════════════════════════════════
 * ⚠️  SÉCURITÉ : Ce fichier contient les endpoints Make.com.
 *     En production, ces valeurs doivent être :
 *     - Chargées depuis des variables d'environnement
 *     - Ou servies par un proxy backend
 *     - JAMAIS exposées dans le code source public
 *
 * Pour le prototype GitHub Pages, on les inclut ici.
 * TODO: Migrer vers Supabase Edge Functions en Phase 2.
 */

export const WEBHOOKS = {
  // Webhook texte (Make.com → Claude API)
  text: "https://hook.eu2.make.com/VOTRE_WEBHOOK_TEXTE",

  // Webhook vision (Make.com → Claude API avec images)
  vision: "https://hook.eu2.make.com/VOTRE_WEBHOOK_VISION",

  // Token d'authentification partagé
  token: "preventia-protect",
};

/**
 * Format d'appel standard vers Make.com (Solution C)
 * Le webhook Make.com attend : { token, payload: JSON.stringify(anthropicBody) }
 * Content-Type: text/plain
 */
export function buildWebhookPayload(anthropicBody) {
  return JSON.stringify({
    token: WEBHOOKS.token,
    payload: JSON.stringify(anthropicBody),
  });
}
