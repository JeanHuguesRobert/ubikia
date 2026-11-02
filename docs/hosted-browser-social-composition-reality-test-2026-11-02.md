---
title: "Assistant de Navigation — préparation vérifiée de publications X et Facebook"
date: "2026-11-02"
last_modified_at: "2026-11-02"
status: "reality-test — observed"
document_role: "operational"
document_kind: "reality-test"
visibility: "public"
lifecycle_state: "working"
language: "fr"
license: "CC BY-SA 4.0"
canonical_url: "https://github.com/JeanHuguesRobert/ubikia/blob/main/docs/hosted-browser-social-composition-reality-test-2026-11-02.md"
update_policy: "UP-DEFAULT-REVIEWED"
provenance:
  origin_type: "real-execution"
  origin_repository: "JeanHuguesRobert/ubikia"
  origin_ref: "https://github.com/JeanHuguesRobert/barons-Mariani/issues/156"
  origin_date: "2026-11-02"
  derived_from:
    - "docs/publication_layer.md"
    - "docs/instagram-publication-package.md"
review:
  status: "execution-evidence"
  reviewed_by: []
---

# Préparation de publications sociales dans Chromium hébergé — Reality Test

## But et limite

Une personne autorise l'agent à **composer** un message public dans un navigateur distant, puis effectue elle-même la validation et le clic de publication. La saisie dans un champ éditable **ne vaut pas publication**. Le résultat distant doit être contrôlé et, si l'auteur publie, l'URL publique doit être observée séparément.

Ce test concerne la diffusion de la Note de Campagne [« Une candidature corse Capable pour 2027 »](https://jeanhugues.substack.com/p/une-candidature-corse-capable-pour) à travers l'extension Cogentia Navigation Assistant sur Fracta2.

## Dispositif testé

- Navigateur Chromium hébergé, gateway local `navigation-assistant-gateway`, capacité `browser.hosted.inspect` pour `tabs` ou `context`.
- Capacité `browser.hosted.interact`, opération `insert_text`, liée à un `tab_id` précis et un `expected_url`.
- Appel de saisie par la bibliothèque Cogentia `scripts/lib/hosted-browser-capabilities.js` en environnement Fracta2, sans activation forcée de l'onglet.
- La personne reste seule responsable du clic de publication, conformément au mandat.

## Observations X/Twitter

- Onglet identifié : `94450128`, `https://x.com/home`, compte affiché `@BaronsMariani`.
- Texte inséré par `browser.hosted.interact` : 253 caractères ; insertion confirmée par un résultat `insertedLength=253` et par une seconde lecture du contexte.
- L'auteur a personnellement cliqué sur « Poster ».
- Post publié **vérifié dans le navigateur**, à l'URL https://x.com/BaronsMariani/status/2117204819173851261, daté par X du 2 novembre 2026 à **10 h 38** (heure affichée).
- Le post vérifié comportait le lien vers Substack et les hashtags `#suvranu #Capable`. Ce contenu final diffère du texte initial saisi par l'agent ; il faut conserver les deux états plutôt que supposer une identité parfaite.

## Observations Facebook — onglet inactif

- Onglet identifié : `94450133`, adresse `https://www.facebook.com/post/create`, **`active=false`** lors du contrôle préalable.
- L'utilisateur avait placé le curseur dans la zone de saisie avant le test.
- `browser.hosted.interact` avec `action=insert_text`, `tab_id=94450133`, `expected_url=https://www.facebook.com/post/create` et la légende fournie a renvoyé `insertedLength=482` ; invocation shell : `7b860d52-84da-4520-8a7e-3b14cca46b1b`.
- Seconde lecture `browser.hosted.inspect` (`action=context`) : texte complet présent dans l'éditeur et son aperçu, lien Substack visible, aperçu du lien en cours de génération ; bouton « Publier » encore présent. **Aucun clic de publication effectué par l'agent.**
- **Résultat significatif** : le ciblage par identifiant d'onglet permet la saisie sans exiger que cet onglet soit actif, à condition que le champ ciblé ait conservé son focus et que l'extension/sa passerelle acceptent la commande.
- Statut au moment de la vérification : `composed_not_published_by_agent`. Aucun lien Facebook public n'a encore été observé.

## Diagnostic des incidents Cogentia

Deux pannes distinctes avaient été rencontrées avant l'exécution de X :

1. Appel `browser.hosted.inspect` sans le champ obligatoire `action` : `BROWSER_ACTION_NOT_ALLOWED`. Correction : envoyer explicitement `input.arguments.action='tabs'` ou `context` dans le paquet `john.request.v1` ; les lectures suivantes ont réussi.
2. Tentative de saisie par le handler `openai.step_reasoner` : `invalid_api_key` **avant** appel de la capacité (`capability_calls=0`). Cela ne prouve pas un refus de l'extension. Le secours documenté appelle directement `createHostedBrowserCapabilities().find(c => c.name==='browser.hosted.interact').execute(...)` sur Fracta2. Il faut réparer séparément l'authentification du handler gouverné, sans contourner les frontières de mandat et sans manipuler de secrets.

Les appels de contrôle `browser.hosted.inspect` via `cogentia_john_run` ont fonctionné après correction du schéma. L'interface de saisie n'exige **pas** la visibilité/activation de l'onglet ; elle exige un identifiant d'onglet exact et une URL attendue cohérente.

## Réutilisation

1. Vérifier le mandat précis de rédaction et la frontière explicite « ne pas publier ».
2. Lister les onglets avec `browser.hosted.inspect(action=tabs, include_url=true)`.
3. Lire le contexte de l'onglet visé avec `action=context` et `tab_id`.
4. Cibler l'onglet sans activation, exécuter `insert_text` avec `tab_id`, `expected_url` et `text` ; **ne pas lancer de page script ni de clic de publication**.
5. Inspecter une nouvelle fois le contexte pour confirmer la présence effective du texte et du lien, sans considérer le seul reçu `insertedLength` comme preuve suffisante.
6. Attendre la publication manuelle de l'auteur ; vérifier ensuite l'URL publique et enregistrer une entrée de publication dans le registre Ubikia uniquement après preuve.

Ce chemin est un précédent observé sur X et Facebook, pas une promesse universelle pour tous les éditeurs `contenteditable` ni pour Instagram.
