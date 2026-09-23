// server.js
// Point d'entrée de l'agent WhatsApp — périmètre PILOTE volontairement limité :
// qualification du besoin uniquement, PUIS remise systématique à un humain.
// L'agent ne confirme JAMAIS un prix, une quantité facturée ou un paiement.

require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { sendWhatsAppMessage, notifyHumanTeam } = require("./src/whatsapp");
const { handleIncomingMessage } = require("./src/conversation");

const app = express();

// Meta envoie le corps brut : on le garde pour vérifier la signature avant de le parser.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

// ---------------------------------------------------------------------------
// 1) Handshake de vérification exigé par Meta à la configuration du webhook
// ---------------------------------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[webhook] Vérification Meta réussie.");
    return res.status(200).send(challenge);
  }
  console.warn("[webhook] Échec de vérification (token invalide).");
  return res.sendStatus(403);
});

// ---------------------------------------------------------------------------
// 2) Vérification de la signature — rejette tout appel qui ne vient pas de Meta
// ---------------------------------------------------------------------------
function isValidSignature(req) {
  if (!APP_SECRET) return true; // ⚠️ à activer obligatoirement en production
  const signature = req.get("X-Hub-Signature-256");
  if (!signature) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(req.rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ---------------------------------------------------------------------------
// 3) Réception des messages entrants
// ---------------------------------------------------------------------------
app.post("/webhook", async (req, res) => {
  // Répondre 200 immédiatement : Meta retente sinon l'appel pendant des heures.
  res.sendStatus(200);

  if (!isValidSignature(req)) {
    console.warn("[webhook] Signature invalide — appel ignoré.");
    return;
  }

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const messages = change?.value?.messages;
    if (!messages || messages.length === 0) return; // accusé de lecture, etc. — rien à faire

    for (const message of messages) {
      const from = message.from; // numéro E.164 du client, ex. "2376XXXXXXXX"
      const type = message.type; // "text" | "image" | ...
      const text = type === "text" ? message.text.body : null;
      const hasImage = type === "image";

      const outcome = await handleIncomingMessage({ from, text, hasImage });

      if (outcome.replyToCustomer) {
        await sendWhatsAppMessage(from, outcome.replyToCustomer);
      }
      if (outcome.escalate) {
        await notifyHumanTeam(outcome.escalate);
      }
    }
  } catch (err) {
    console.error("[webhook] Erreur de traitement :", err);
  }
});

app.get("/", (_req, res) => res.send("Agent WhatsApp 9000 CADEAUX — pilote actif."));

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
