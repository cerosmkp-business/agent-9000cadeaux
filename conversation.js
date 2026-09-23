// src/conversation.js
//
// Portée volontairement réduite (pilote) : cet agent qualifie le besoin puis
// remet systématiquement à un humain. Il ne fait JAMAIS les choses suivantes,
// par construction — pas par oubli :
//   - annoncer un prix ou une remise
//   - confirmer une commande
//   - traiter ou valider un paiement Mobile Money
// Ces trois actions restent la seule responsabilité d'un humain.
//
// ⚠️ État en mémoire (Map) : convient pour un pilote sur un volume limité.
// Avant un déploiement à grande échelle, remplacez ce stockage par une vraie
// base de données (Postgres/Redis) — l'état serait sinon perdu à chaque
// redémarrage du serveur et ne pourrait pas être partagé entre plusieurs
// instances si vous scalez horizontalement.

const sessions = new Map();

const STEP = {
  START: "START",
  ASK_SECTEUR: "ASK_SECTEUR",
  ASK_PRODUIT: "ASK_PRODUIT",
  ASK_LOGO: "ASK_LOGO",
  ESCALATED: "ESCALATED",
};

function getSession(from) {
  if (!sessions.has(from)) {
    sessions.set(from, { step: STEP.START, secteur: null, produit: null, aLogo: null });
  }
  return sessions.get(from);
}

async function handleIncomingMessage({ from, text, hasImage }) {
  const session = getSession(from);

  switch (session.step) {
    case STEP.START: {
      session.step = STEP.ASK_SECTEUR;
      return {
        replyToCustomer:
          "Bonjour et bienvenue chez 9000 CADEAUX 👋\n" +
          "Pour préparer votre devis rapidement, quel est votre secteur d'activité ? " +
          "(ex. pharmacie, restaurant, institution, événement...)",
      };
    }

    case STEP.ASK_SECTEUR: {
      session.secteur = text || "non précisé";
      session.step = STEP.ASK_PRODUIT;
      return {
        replyToCustomer:
          "Merci ! Quel(s) objet(s) souhaitez-vous personnaliser, et en quelle quantité approximative ? " +
          "(ex. 200 porte-clés et 100 casquettes)",
      };
    }

    case STEP.ASK_PRODUIT: {
      session.produit = text || "non précisé";
      session.step = STEP.ASK_LOGO;
      return {
        replyToCustomer:
          "Parfait. Avez-vous un logo ou un texte à imprimer ? Envoyez-le maintenant en photo, " +
          "ou répondez simplement « non » si vous n'en avez pas encore.",
      };
    }

    case STEP.ASK_LOGO: {
      session.aLogo = hasImage ? "Logo envoyé en pièce jointe" : (text || "Pas de logo pour le moment");
      session.step = STEP.ESCALATED;

      const recap =
        `📥 Nouvelle demande qualifiée (${from})\n` +
        `Secteur : ${session.secteur}\n` +
        `Objet(s) souhaité(s) : ${session.produit}\n` +
        `Logo/texte : ${session.aLogo}\n\n` +
        `→ Un devis reste à préparer manuellement.`;

      return {
        replyToCustomer:
          "Merci, votre demande est complète ✅ Un conseiller va vous répondre avec un devis précis très bientôt.",
        escalate: recap,
      };
    }

    case STEP.ESCALATED:
    default: {
      // Le dossier est déjà entre les mains d'un humain : on ne relance pas
      // la qualification, on rassure simplement le client et on ping l'équipe
      // s'il relance de son côté (peut indiquer une impatience à traiter).
      return {
        replyToCustomer: "Votre demande est bien entre les mains de notre équipe, merci de votre patience 🙏",
        escalate: `↩️ Le client ${from} a envoyé un nouveau message alors que son dossier est déjà en cours de traitement humain.`,
      };
    }
  }
}

module.exports = { handleIncomingMessage };
