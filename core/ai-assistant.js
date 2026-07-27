/**
 * PréventIA Protect — Core AI Assistant
 * ═══════════════════════════════════════
 * Service d'assistant IA contextuel partagé par tous les modules.
 *
 * Usage :
 *   import { createAssistant } from '../../core/ai-assistant.js';
 *   const assistant = createAssistant('chimique', {
 *     systemPrompt: 'Tu es expert en risque chimique...',
 *     context: () => getInventoryContext(),
 *   });
 *   const response = await assistant.ask('Que signifie H350 ?');
 */

import { APP_CONFIG } from '../config/app.config.js';
import { WEBHOOKS, buildWebhookPayload } from '../config/webhooks.config.js';

/**
 * Crée un assistant IA contextualisé pour un module
 * @param {string} moduleId — identifiant du module
 * @param {object} options
 * @param {string} options.systemPrompt — prompt système spécialisé
 * @param {Function} options.context — fonction retournant le contexte dynamique
 * @param {string} [options.webhook] — webhook à utiliser (défaut: text)
 */
export function createAssistant(moduleId, options = {}) {
  const {
    systemPrompt = '',
    context = () => '',
    webhook = WEBHOOKS.text,
  } = options;

  let history = [];

  return {
    /** Identifiant du module */
    moduleId,

    /** Historique des messages */
    get history() { return [...history]; },

    /** Réinitialise l'historique */
    reset() { history = []; },

    /**
     * Envoie une question à l'IA
     * @param {string} userMessage — question de l'utilisateur
     * @returns {Promise<string>} — réponse de l'IA
     */
    async ask(userMessage) {
      // Construction du prompt système avec contexte dynamique
      const ctx = typeof context === 'function' ? context() : context;
      const system = [
        systemPrompt,
        ctx ? `\nContexte actuel :\n${ctx}` : '',
        '\nRègles : Réponds en français, de manière concise et opérationnelle.',
        'Cite les articles du Code du travail et les références INRS quand pertinent.',
      ].filter(Boolean).join('\n');

      // Ajout au historique
      history.push({ role: 'user', content: userMessage });

      // Construction du body Anthropic
      const anthropicBody = {
        model: APP_CONFIG.ai.model,
        max_tokens: APP_CONFIG.ai.maxTokens,
        system,
        messages: history.map(m => ({ role: m.role, content: m.content })),
      };

      try {
        const resp = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: buildWebhookPayload(anthropicBody),
        });

        const raw = await resp.text();
        let reply;

        try {
          const parsed = JSON.parse(raw);
          reply = parsed?.content?.[0]?.text || raw;
        } catch {
          reply = raw;
        }

        // Clean markdown artifacts
        reply = reply.replace(/```json\n?|```/g, '').trim();

        // Ajout à l'historique
        history.push({ role: 'assistant', content: reply });

        return reply;
      } catch (error) {
        const errorMsg = 'Erreur de connexion au service IA. Vérifiez votre réseau.';
        history.push({ role: 'assistant', content: errorMsg });
        throw new Error(errorMsg);
      }
    },

    /**
     * Envoie un prompt structuré et attend du JSON
     * @param {string} prompt — prompt complet
     * @returns {Promise<object>} — objet JSON parsé
     */
    async askJSON(prompt) {
      const anthropicBody = {
        model: APP_CONFIG.ai.model,
        max_tokens: APP_CONFIG.ai.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      };

      const resp = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: buildWebhookPayload(anthropicBody),
      });

      const raw = await resp.text();
      try {
        const parsed = JSON.parse(raw);
        const text = parsed?.content?.[0]?.text || raw;
        return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
      } catch {
        throw new Error('Réponse IA non structurée');
      }
    },
  };
}
