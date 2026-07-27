/**
 * PréventIA Protect — Core AI Photo Analysis
 * ═════════════════════════════════════════════
 * Service d'analyse d'image par vision IA.
 * Compression client-side + envoi webhook Make.com.
 *
 * Usage :
 *   import { analyzePhoto, captureFromCamera, compressImage } from '../../core/ai-photo.js';
 *   const dataUrl = await compressImage(file);
 *   const result = await analyzePhoto(dataUrl, 'Analyse cet EPI...');
 */

import { APP_CONFIG } from '../config/app.config.js';
import { WEBHOOKS, buildWebhookPayload } from '../config/webhooks.config.js';

/**
 * Compresse une image côté client
 * @param {File} file — fichier image
 * @param {number} maxWidth — largeur max (défaut 1024)
 * @param {number} quality — qualité JPEG 0-1 (défaut 0.7)
 * @returns {Promise<string>} — data URL compressée
 */
export function compressImage(file, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image invalide'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Ouvre la caméra et retourne le flux vidéo
 * @param {object} options — contraintes getUserMedia
 * @returns {Promise<MediaStream>}
 */
export async function openCamera(options = {}) {
  const constraints = {
    video: {
      facingMode: options.facingMode || 'environment',
      width: { ideal: options.width || 1280 },
    },
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Capture une frame depuis un élément vidéo
 * @param {HTMLVideoElement} videoElement
 * @param {number} quality — qualité JPEG
 * @returns {string} — data URL
 */
export function captureFromVideo(videoElement, quality = 0.8) {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Analyse une image par vision IA
 * @param {string} dataUrl — image en base64 data URL
 * @param {string} prompt — instructions d'analyse
 * @returns {Promise<object>} — résultat JSON parsé
 */
export async function analyzePhoto(dataUrl, prompt) {
  const base64 = dataUrl.split(',')[1];
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';

  const anthropicBody = {
    model: APP_CONFIG.ai.model,
    max_tokens: APP_CONFIG.ai.maxTokens,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: prompt },
      ],
    }],
  };

  const resp = await fetch(WEBHOOKS.vision, {
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
    return { error: true, raw };
  }
}
