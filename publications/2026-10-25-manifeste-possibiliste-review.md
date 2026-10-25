---
title: "Relecture — Contre l'Académie"
author: Jean Hugues Noël Robert
date: '2026-10-25'
version: '0.1'
status: draft
document_role: working-note
document_kind: publication-review-checklist
visibility: public
lifecycle_state: working
language: fr
update_policy: UP-DEFAULT-REVIEWED
provenance:
  origin_type: repository
  origin_repository: JeanHuguesRobert/ubikia
  origin_ref: main
  origin_date: '2026-10-25'
  derived_from:
    - publications/2026-10-25-manifeste-possibiliste.md
review:
  status: pending-human-review
  reviewed_by: []
---

# Paquet Substack — fiche de relecture

## Destination proposée

- Publication : *Les Carnets du baron Mariani* — https://jeanhugues.substack.com
- Titre : **Contre l'Académie — L'indépendance d'esprit d'abord**
- Sous-titre : *Manifeste possibiliste*
- Slug suggéré : `contre-lacademie-independance-desprit-dabord`
- Description / extrait : « Un manifeste pour la liberté de chercher, la confrontation au monde et la transmission avec corrections. »
- Tags proposés : possibilisme, recherche, indépendance d'esprit
- Fichier Markdown prêt pour relecture : [2026-10-25-manifeste-possibiliste.md](2026-10-25-manifeste-possibiliste.md)
- Rendu HTML hors ligne avec le convertisseur Substack du dépôt : [2026-10-25-manifeste-possibiliste.html](2026-10-25-manifeste-possibiliste.html)
- Source canonique : [Manifeste v0.4](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/manifeste_possibiliste_contre_academie.md)
- Document compagnon, lié mais non recopié : [Note de lecture analytique v0.1](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/manifeste_possibiliste_note_analytique.md)

## Modifications éditoriales

1. Ajout d'un chapeau de deux phrases, fidèle à la thèse explicitement formulée dans le manifeste.
2. Déplacement des deux lignes de titre du corps vers les champs titre/sous-titre du paquet, pour éviter de répéter le titre dans l'article Substack.
3. Remplacement du lien relatif vers la Note analytique par son URL canonique. Le texte et l'ordre des paragraphes du manifeste sont conservés ; aucune section argumentative n'a été ajoutée ou supprimée.
4. Ajout des métadonnées, du slug et des tags proposés. Ils ne modifient pas le texte du manifeste.

Les empreintes SHA-256 et les révisions effectivement utilisées sont inscrites dans le frontmatter du paquet. La révision `5243c204e3b6eff072bef1d3cd86d5c617b12d2e` est le commit de `main` observé lors de la récupération ; les identifiants de blob et empreintes de contenu différencient les deux sources.

## Contrôle local effectué

- Conversion Markdown vers HTML hors réseau par `markdownToSubstackHtml` dans `src/substack-publisher.js`.
- Contrôle automatisé du titre, des liens, du gras, de l'italique, des séparateurs, des intertitres et de la conservation des passages clés.
- Vérification que le HTML versionné correspond au rendu local du corps Markdown.
- Le paquet reste `draft` et exige une relecture humaine. Aucun état `ready_for_manual_publication` ou `published` n'est présumé.

La conversion actuelle produit des paragraphes HTML séparés pour chaque ligne non vide. Les sauts de ligne poétiques restent donc des séparations de paragraphes dans le rendu. À vérifier visuellement lors de la relecture Substack ; le helper repose sur un endpoint non garanti et son fonctionnement distant n'est pas établi ici.

## Checklist de relecture Substack

- [ ] Lire le chapeau et confirmer qu'il présente fidèlement le texte.
- [ ] Vérifier la typographie du titre et du sous-titre.
- [ ] Contrôler le rendu des intertitres, italiques, gras, liens et séparateurs.
- [ ] Vérifier sur la plateforme que les paragraphes et espaces correspondent au rythme souhaité.
- [ ] Confirmer les tags et la description avant toute création de brouillon.
- [ ] Décider séparément si un brouillon distant doit être créé.
- [ ] Si publication humaine ultérieure : enregistrer l'URL réellement observée et le retour éventuel au Corpus dans le registre, avec preuves distinctes.

## Handoff et frontière d'autorité

Ce packet autorise uniquement la recherche, la dérivation locale, les artefacts versionnés, les tests hors réseau et la documentation. Il n'autorise ni brouillon distant, ni programmation, ni publication, ni newsletter, ni email. Une continuation distincte devra mandater explicitement la création d'un brouillon Substack avant tout appel distant.

Après mandat séparé seulement, le futur appel devra être effectué localement avec les variables protégées `SUBSTACK_SUBDOMAIN` et `SUBSTACK_SID`, sans les afficher, les journaliser ou les versionner. La commande actuelle `cli/substack-publish.js` crée un brouillon via un endpoint non garanti ; elle ne doit pas être exécutée sous ce packet.

L'URL réelle et le statut `published` ne pourront être inscrits qu'après preuve d'une publication humaine effective. Un brouillon distant, s'il est autorisé par la suite, n'est pas une publication.
