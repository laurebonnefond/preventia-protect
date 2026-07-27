/**
 * PréventIA Protect — Core Voice
 * ════════════════════════════════
 * Dictée vocale via Web Speech API.
 * Permet de remplir des champs par la voix sur le terrain.
 *
 * Usage :
 *   import { createVoiceInput } from '../../core/ai-voice.js';
 *   const voice = createVoiceInput({ lang: 'fr-FR' });
 *   voice.start(text => { inputElement.value = text; });
 */

/**
 * Vérifie la disponibilité de la reconnaissance vocale
 */
export function isVoiceAvailable() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Crée un service de dictée vocale
 * @param {object} options
 * @param {string} options.lang — langue (défaut 'fr-FR')
 * @param {boolean} options.continuous — mode continu (défaut false)
 */
export function createVoiceInput(options = {}) {
  const { lang = 'fr-FR', continuous = false } = options;

  if (!isVoiceAvailable()) {
    return {
      available: false,
      start: () => console.warn('[Voice] Non disponible sur ce navigateur'),
      stop: () => {},
    };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = true;

  let onResult = () => {};
  let onEnd = () => {};
  let isListening = false;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    const isFinal = event.results[event.results.length - 1].isFinal;
    onResult(transcript, isFinal);
  };

  recognition.onend = () => { isListening = false; onEnd(); };
  recognition.onerror = (e) => { isListening = false; console.warn('[Voice] Erreur:', e.error); };

  return {
    available: true,
    get isListening() { return isListening; },

    start(resultCallback, endCallback = () => {}) {
      onResult = resultCallback;
      onEnd = endCallback;
      isListening = true;
      recognition.start();
    },

    stop() {
      recognition.stop();
      isListening = false;
    },

    toggle(resultCallback, endCallback) {
      if (isListening) this.stop();
      else this.start(resultCallback, endCallback);
    },
  };
}
