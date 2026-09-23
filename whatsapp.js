// src/whatsapp.js
const axios = require("axios");

const GRAPH_API_VERSION = "v21.0"; // vérifiez la version courante dans la doc Meta avant déploiement
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const HUMAN_TEAM_NUMBER = process.env.HUMAN_TEAM_WHATSAPP_NUMBER; // numéro du CM / responsable, format E.164 sans "+"

const client = axios.create({
  baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

/**
 * Envoie un message texte libre à un client.
 * ⚠️ Un message texte libre ne peut être envoyé que dans la fenêtre de 24h
 * (ou 72h si la conversation vient d'une publicité Clic-vers-WhatsApp) ouverte
 * par le dernier message du client. En dehors de cette fenêtre, il faut un
 * message modèle ("template") pré-approuvé par Meta — non traité par ce pilote.
 */
async function sendWhatsAppMessage(to, body) {
  try {
    await client.post("/messages", {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    });
  } catch (err) {
    console.error("[whatsapp] Échec d'envoi à", to, err.response?.data || err.message);
  }
}

/**
 * Transmet un résumé structuré à l'équipe humaine (CM / responsable production).
 * Pilote volontairement simple : un message WhatsApp direct au responsable.
 * Une version ultérieure pourra écrire dans le tableur de suivi de commandes
 * ou un outil de tickets plutôt que d'envoyer un message brut.
 */
async function notifyHumanTeam(summary) {
  if (!HUMAN_TEAM_NUMBER) {
    console.warn("[whatsapp] HUMAN_TEAM_WHATSAPP_NUMBER non configuré — résumé affiché en console uniquement :");
    console.log(summary);
    return;
  }
  await sendWhatsAppMessage(HUMAN_TEAM_NUMBER, summary);
}

module.exports = { sendWhatsAppMessage, notifyHumanTeam };
