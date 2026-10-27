---
title: "Substack — création d'un brouillon par Ubikia (HTTP, sans navigateur)"
date: "2026-10-27"
version: "0.1"
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
  - "src/substack-publisher.js"
  - "docs/publication_layer.md"
  - "docs/derivation_workflow.md"
---

# Créer un brouillon Substack via Ubikia

## Dispositif déjà implémenté

Le fichier `cli/substack-publish.js` est un CLI Node.js ESM qui lit une publication Markdown et invoque `createSubstackDraft()` dans `src/substack-publisher.js`. La création se fait par **POST HTTPS** vers `https://<sous-domaine>.substack.com/api/v1/drafts`, avec un document ProseMirror et une version HTML. En cas de succès, il renvoie `draft_id` et l'URL d'édition `/publish/post/<id>`. **Aucune commande de publication finale n'est appelée par ce CLI.**

Ce chemin ne nécessite **ni navigateur contrôlable ni intervention dans l'interface Substack** pour la seule création du brouillon. Il nécessite cependant un **environnement d'exécution Node autorisé à joindre Substack**, les fichiers sources présents localement, et une **session Substack valide**.

## Prérequis et secret

- `SUBSTACK_SUBDOMAIN=jeanhugues` (publication constatée : https://jeanhugues.substack.com/).
- `SUBSTACK_SID` : valeur de cookie de session **secrète**, injectée via un coffre ou l'environnement du processus. Ne jamais l'afficher, la consigner dans une Issue, la passer dans des arguments de CLI, la déposer sur GitHub, ni l'envoyer à un assistant.
- Un clone local à jour de `JeanHuguesRobert/ubikia` et un fichier Markdown de publication en local.
- Ne jamais supposer qu'une session ouverte dans le navigateur peut être lue depuis un agent distant : ce sont deux contextes d'authentification distincts.

## Procédure

Depuis la racine locale d'Ubikia, avec les variables ci-dessus **déjà injectées dans l'environnement d'exécution sécurisé** :

```bash
node cli/substack-publish.js /chemin/local/vers/publication.md
```

Le CLI affiche normalement le titre, puis, en cas de succès, l'identifiant de brouillon et une URL telle que `https://jeanhugues.substack.com/publish/post/ID`. Ne considérer l'opération comme accomplie que si Substack renvoie un succès avec un ID exploitable, puis vérifier le brouillon depuis l'interface sans le publier.

La source souveraine reste inchangée. Le Markdown dérivé conserve `source_path`, `source_commit`, auteur, version et statut ; le registre de publication doit enregistrer l'ID et l'URL **uniquement après confirmation**.

## Cas documenté au 27 octobre 2026

- Source validée : `barons-Mariani/research/corse_selon_macron_autopsie_manoeuvre_avortee.md` au commit `3b6b591a37a0b77102fd1c0a709b1217b47eef80`.
- Paquet dérivé déjà préparé : `barons-Mariani/publications/2026-10-27-corse-selon-macron-substack.md`.
- Cible : `jeanhugues.substack.com`.
- **Aucun ID de brouillon ni URL d'édition Substack confirmé** dans cette session.
- Le MCP Cogentia `cogentia_john_run` a été essayé ; sa configuration présente `mock.echo` avec **zéro effet externe**. Ce résultat n'exécute pas la commande Node et n'est pas une preuve de création.
- Les outils GitHub disponibles permettent de déposer les fichiers ; ils ne fournissent ni le cookie de session ni une exécution Node distante avec accès au réseau Substack. Ne pas prétendre que l'onglet Substack connecté fournit ces capacités.

## Fiabilisation / anomalies à tester

1. `parseMarkdownPublication()` utilise des expressions régulières sur le YAML, et non un vrai parseur YAML : tester les titres et sous-titres entre guillemets, les caractères `:`, les apostrophes et les chaînes multilignes. Vérifier la sortie du CLI sur un exemple contenant des citations.
2. `markdownToProseMirrorDoc()` traite chaque ligne non vide en paragraphe indépendant ; les paragraphes longs, les listes imbriquées et les liens doivent être inspectés dans le brouillon réel. L'HTML n'échappe pas systématiquement les caractères réservés : éviter d'en supposer la sûreté pour du Markdown non fiable.
3. L'endpoint HTTP de Substack est non contractuel ; erreurs d'authentification, exigences CSRF et évolutions du schéma sont possibles.
4. Avant chaque nouvelle tentative : vérifier si un brouillon correspondant existe déjà pour éviter les doublons. Le CLI actuel ne le fait pas.
5. Conserver un statut séparé : `package_prepared` / `draft_created` / `author_reviewed` / `published`. Jamais `published` par simple succès d'un POST de brouillon.
6. Ne jamais lancer l'envoi aux abonnés ni la publication sans autorisation explicite et spécifique du responsable éditorial.

## Traçabilité

Les étapes recommandées dans `docs/derivation_workflow.md` et `docs/publication_layer.md` s'appliquent : **source → dérivé → revue → paquet → brouillon → validation humaine → publication → registre → retour au Corpus**. L'absence de canal de calcul opérationnel est un blocage d'exécution, non une inexistence du mécanisme.
