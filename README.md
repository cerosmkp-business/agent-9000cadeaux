# Agent WhatsApp 9000 CADEAUX — Pilote de qualification

## Ce que ce code fait réellement

Il reçoit les messages WhatsApp de vos prospects (issus de vos publicités
Facebook), leur pose 3 questions pour qualifier leur besoin (secteur, objet(s)
souhaité(s), logo), puis **transmet automatiquement un résumé structuré à
votre équipe humaine** pour qu'elle prenne le relais avec un devis.

## Ce que ce code NE fait PAS — volontairement

- Il n'annonce aucun prix.
- Il ne confirme aucune commande.
- Il ne traite ni ne vérifie aucun paiement Mobile Money.

Ces trois actions restent entièrement humaines. Ce n'est pas une limite
technique de ce pilote : c'est un garde-fou délibéré. Un agent qui promettrait
un prix ou une quantité de façon incorrecte engagerait votre entreprise
sans qu'un humain ait pu vérifier quoi que ce soit.

## Ce qu'il vous reste à faire avant que ça fonctionne réellement

Ce code ne peut pas s'exécuter tout seul : il lui faut un compte WhatsApp
Business Platform et un endroit où tourner en continu. Aucune de ces étapes
ne peut être faite à votre place — elles demandent votre identité légale
d'entreprise (vérification Meta) ou un compte de paiement à votre nom.

1. **Créer un compte Meta Business Manager** (business.facebook.com) et le
   faire vérifier — nécessite vos documents d'entreprise.
2. **Choisir un fournisseur (BSP)** pour accéder à l'API WhatsApp Business.
   Options courantes : 360dialog, Twilio, Gupshup. Comparez leurs tarifs
   avant de choisir — ils ajoutent une marge au tarif Meta.
3. **Récupérer trois valeurs** depuis votre BSP/Meta et les mettre dans un
   fichier `.env` (copiez `.env.example`) :
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `META_APP_SECRET`
4. **Choisir un hébergement** pour ce serveur (il doit rester allumé 24h/24
   et avoir une adresse publique en HTTPS). Options simples et économiques :
   Railway, Render, ou un petit VPS. Évitez votre ordinateur personnel — le
   webhook doit rester joignable en permanence.
5. **Configurer le webhook côté Meta** avec l'URL de votre serveur déployé
   (`https://votre-app.exemple.com/webhook`) et le `WHATSAPP_VERIFY_TOKEN`
   que vous aurez choisi dans votre `.env`.
6. **Vérifier le format de vos 3 publicités Facebook actuelles** : configurez-les
   en objectif "Clic-vers-WhatsApp" si ce n'est pas déjà le cas — c'est ce qui
   vous donne une fenêtre de conversation gratuite de 72h (voir échange
   précédent sur la tarification WhatsApp).

## Comment tester en local avant de déployer

```bash
npm install
cp .env.example .env
# remplissez .env avec vos vraies valeurs
node server.js
```

Le serveur écoute sur `http://localhost:3000`. Pour que Meta puisse
réellement lui envoyer des messages pendant vos tests, utilisez un tunnel
temporaire (par ex. `ngrok http 3000`) et donnez l'URL ngrok à Meta.

## Qui doit faire les étapes ci-dessus ?

Si vous n'avez pas le temps ou l'envie de suivre ces étapes vous-même,
c'est exactement le travail qu'un développeur (ou vous-même avec Claude
Code, si vous voulez vous y mettre) peut faire à partir de ce code déjà
écrit — la partie la plus longue (écrire la logique de conversation) est
déjà faite. Il reste la configuration des comptes et le déploiement.

## Prochaine étape recommandée une fois déployé

Faites tourner ce pilote sur une petite partie de votre trafic (une seule
des 3 publicités, par exemple) pendant une à deux semaines. Mesurez :
- le temps que ça libère réellement pour votre CM,
- le taux de conversations qui aboutissent malgré tout à une vente.

Étendez ensuite le périmètre (devis automatisé, relances) seulement après
avoir vu ces chiffres — pas avant.
