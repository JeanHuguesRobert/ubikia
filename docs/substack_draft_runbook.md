---
title: "Substack — création d'un brouillon par Ubikia (HTTP, sans navigateur)"
date: "2026-10-27"
version: "0.2"
status: "working-paper"
document_role: source
document_kind: runbook
visibility: public
lifecycle_state: active
language: fr
license: CC BY-SA 4.0
canonical_url: "https://github.com/JeanHuguesRobert/ubikia/blob/main/docs/substack_draft_runbook.md"
update_policy: UP-DEFAULT-REVIEWED
review:
  status: "documented-from-source-code"
  reviewed_by: []
source_documents:
  - "cli/substack-publish.js"
  - "cli/publish.js"
  - "src/adapters/index.js"
  - "src/supabase-vault.js"
  - "src/substack-publisher.js"
  - "docs/publication_layer.md"
  - "docs/derivation_workflow.md"
changelog:
  - "0.2 (2026-10-27) — ajoute le chemin d'appel depuis les consignes et README, documente le CLI unifié et le Twin Vault, et consigne le brouillon devenu publication après révision humaine."
  - "0.1 (2026-10-27) — première documentation du CLI Substack."
---

# Créer un brouillon Substack via Ubikia

## Découverte rapide

Pour un Cognitive Packet qui demande un **brouillon Substack**, ouvrir ce runbook depuis le [README](../README.md#quick-orientation) ou les [consignes d'agent](../AGENTS.md#publication-substack), puis utiliser `node cli/publish.js --target=substack <fichier.md>`. Ce CLI unifié est le chemin recommandé : il résout les paramètres depuis l'environnement et le Twin Vault Supabase. Le CLI historique `cli/substack-publish.js` ne lit que les variables d'environnement.

Le mandat doit préciser la publication cible et autoriser la création du brouillon. Cette commande ne publie pas et n'envoie pas de newsletter. Une autorisation de brouillon ne vaut pas autorisation de publier.

## Dispositif déjà implémenté

Le chemin recommandé est `cli/publish.js --target=substack`. Il lit une publication Markdown et appelle l'adaptateur Substack (`src/adapters/index.js`), qui invoque `createSubstackDraft()` dans `src/substack-publisher.js`. La création se fait par **POST HTTPS** vers `https://<sous-domaine>.substack.com/api/v1/drafts`, avec un document ProseMirror et une version HTML. En cas de succès, le CLI renvoie `draft_id` et l'URL d'édition `/publish/post/<id>`. Il ne contient aucun appel de publication finale.

Ce chemin ne nécessite **ni navigateur contrôlable ni intervention dans l'interface Substack** pour la seule création du brouillon. Il nécessite cependant un **environnement d'exécution Node autorisé à joindre Substack**, les fichiers sources présents localement, et une **session Substack valide**.

## Prérequis et secret

- Le Twin Vault de l'Agent JHN contient les clés de configuration `substack_subdomain` et `substack_sid`. `src/adapters/index.js` les résout par `src/supabase-vault.js` depuis `public.instance_config`; les variables d'environnement correspondantes ont priorité si elles sont définies.
- Pour le chargement du Twin Vault, l'exécution de confiance doit déjà disposer de `SUPABASE_URL` et d'une clé Supabase adaptée. La clé de service est réservée à cet environnement serveur privé : ne jamais l'afficher, la placer dans un client, l'ajouter au dépôt ou la transmettre à un assistant. Ne jamais afficher ou journaliser la valeur de `SUBSTACK_SID`.
- Le chemin direct `cli/substack-publish.js` exige `SUBSTACK_SUBDOMAIN` et `SUBSTACK_SID` dans l'environnement et ne charge pas le Vault. Si les paramètres Substack sont seulement dans le Vault, employer le CLI unifié ci-dessous.
- Un clone local à jour de `JeanHuguesRobert/ubikia` et un fichier Markdown de publication en local.
- Un environnement Node.js autorisé à joindre Substack et Supabase lorsque le Vault est utilisé. L'accès au navigateur de l'utilisateur n'est pas requis pour créer le brouillon.

## Procédure

Depuis la racine locale d'Ubikia, avec le Twin Vault accessible ou les identifiants Substack déjà injectés dans l'environnement d'exécution sécurisé :

```bash
node cli/publish.js --target=substack /chemin/local/vers/publication.md
```

Avant l'appel, vérifier dans Substack qu'un brouillon correspondant n'existe pas déjà : le CLI ne déduplique pas et un nouvel appel peut créer un doublon. Après l'appel, confirmer un résultat réussi avec ID et URL d'édition. Contrôler le titre, le sous-titre, le corps, les liens et le statut du brouillon. Le contrôle dans l'interface est une revue humaine, distincte du retour API.

Le paquet dérivé conserve le dépôt et chemin source, le commit et la version, l'auteur, le statut et la destination. Noter séparément le résultat API (`draft_created`), la revue (`author_reviewed`) et l'état de publication (`published`) ; ne jamais déduire un état ultérieur du seul ID de brouillon. Après une modification manuelle substantielle dans Substack, comparer le texte publié au source et rétro-intégrer les changements autorisés dans le document souverain en augmentant sa version. Conserver la preuve de la publication et le résumé de rétro-intégration dans le paquet ou le registre.

## Cas documenté au 27 octobre 2026

- Source validée : `barons-Mariani/research/corse_selon_macron_autopsie_manoeuvre_avortee.md` au commit `3b6b591a37a0b77102fd1c0a709b1217b47eef80`.
- Paquet dérivé déjà préparé : `barons-Mariani/publications/2026-10-27-corse-selon-macron-substack.md`.
- Cible : `jeanhugues.substack.com`.
- Brouillon créé le 27 octobre 2026 : ID `222323343`, URL d'édition `https://jeanhugues.substack.com/publish/post/222323343`, depuis le commit source `3b6b591a37a0b77102fd1c0a709b1217b47eef80`.
- L'auteur a ensuite révisé manuellement le brouillon et publié l'article : https://jeanhugues.substack.com/p/la-corse-selon-e-macron-autopsie . La version source `0.2` rétro-intègre les ajouts de fond ; la fiche dérivée conserve le commit de création (source `0.1`) et consigne le texte après rétro-intégration (`0.2`).
- Le succès d'un appel de création prouve seulement la création du brouillon. Le statut `published` de cet exemple repose sur la page publique consultée, pas sur le CLI.

## Fiabilisation / anomalies à tester

1. `parseMarkdownPublication()` utilise des expressions régulières sur le YAML, et non un vrai parseur YAML : tester les titres et sous-titres entre guillemets, les caractères `:`, les apostrophes et les chaînes multilignes. Vérifier la sortie du CLI sur un exemple contenant des citations.
2. `markdownToProseMirrorDoc()` traite chaque ligne non vide en paragraphe indépendant ; les paragraphes longs, les listes imbriquées et les liens doivent être inspectés dans le brouillon réel. L'HTML n'échappe pas systématiquement les caractères réservés : éviter d'en supposer la sûreté pour du Markdown non fiable.
3. L'endpoint HTTP de Substack est non contractuel ; erreurs d'authentification, exigences CSRF et évolutions du schéma sont possibles.
4. Avant chaque nouvelle tentative : vérifier si un brouillon correspondant existe déjà pour éviter les doublons. Le CLI actuel ne le fait pas.
5. Conserver un statut séparé : `package_prepared` / `draft_created` / `author_reviewed` / `published`. Jamais `published` par simple succès d'un POST de brouillon.
6. Ne jamais lancer l'envoi aux abonnés ni la publication sans autorisation explicite et spécifique du responsable éditorial.

## Traçabilité

Les étapes recommandées dans `docs/derivation_workflow.md` et `docs/publication_layer.md` s'appliquent : **source → dérivé → revue → paquet → brouillon → validation humaine → publication → registre → retour au Corpus**. L'absence de canal de calcul opérationnel est un blocage d'exécution, non une inexistence du mécanisme.
