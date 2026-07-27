/**
 * PréventIA Protect — Core OCR
 * ══════════════════════════════
 * Extraction de données depuis documents photographiés.
 * Réutilise le service ai-photo avec des prompts spécialisés OCR.
 *
 * Usage :
 *   import { ocrDocument } from '../../core/ai-ocr.js';
 *   const data = await ocrDocument(dataUrl, 'fds');
 */

import { analyzePhoto } from './ai-photo.js';

/** Prompts OCR par type de document */
const OCR_PROMPTS = {
  fds: `Expert IPRP. Extrais de cette FDS : nom produit, CAS, pictogrammes GHS01-09, mentions H/P, groupe stockage (ACIDES|BASES|INFLAMMABLES|COMBURANTS|TOXIQUES|CORROSIFS|GAZ|CMR_ISOLE|NEUTRE), CMR oui/non, VLEP. JSON uniquement.`,
  
  certificat: `Expert IPRP. Extrais de ce certificat/attestation : type document, organisme, date, prochain contrôle, équipement (catégorie EPI|EPC|MACHINE, type, désignation, norme, n° série), résultat, réserves. JSON uniquement.`,
  
  vgp: `Expert IPRP. Extrais de ce rapport VGP : organisme contrôle, date contrôle, date prochain, équipement (type, désignation, n° série, localisation), résultat (conforme/non conforme/avec réserves), observations, réserves. JSON uniquement.`,
  
  etiquette: `Expert IPRP. Extrais de cette étiquette CLP/produit : nom, fabricant, CAS, pictogrammes GHS, mentions H et P, classe danger, conseils stockage. JSON uniquement.`,
  
  auto: `Expert IPRP. Identifie d'abord le type de document (FDS, certificat, rapport VGP, étiquette, bon de livraison, attestation, permis, autre). Puis extrais toutes les données pertinentes pour la santé-sécurité au travail. JSON uniquement.`,
};

/**
 * Effectue une extraction OCR sur un document photographié
 * @param {string} dataUrl — image base64
 * @param {string} docType — type de document (fds|certificat|vgp|etiquette|auto)
 * @returns {Promise<object>} — données extraites
 */
export async function ocrDocument(dataUrl, docType = 'auto') {
  const prompt = OCR_PROMPTS[docType] || OCR_PROMPTS.auto;
  return analyzePhoto(dataUrl, prompt);
}
