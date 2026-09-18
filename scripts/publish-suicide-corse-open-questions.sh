#!/usr/bin/env bash
# Derive and stage the living Suicide Corse open-questions page independently
# from any frozen book edition.
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly UBIKIA_DIR="${UBIKIA_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
readonly BARONS_MARIANI_DIR="${BARONS_MARIANI_DIR:-$(cd "$UBIKIA_DIR/../barons-Mariani" && pwd)}"
readonly SUICIDE_CORSE_SITE_DIR="${SUICIDE_CORSE_SITE_DIR:-$(cd "$UBIKIA_DIR/../suicide-corse" && pwd)}"
readonly SOURCE="$BARONS_MARIANI_DIR/projects/suicide-corse/manuscript/questions-ouvertes.md"
readonly TARGET="$SUICIDE_CORSE_SITE_DIR/questions-ouvertes.html"

apply=false
commit=false
push=false
work_dir=""
stage=""
backup=""

fail() { printf 'publish-suicide-corse-open-questions: %s\n' "$*" >&2; exit 1; }

cleanup() {
  if [[ -n "$backup" && -f "$backup" && ! -f "$TARGET" ]]; then mv -- "$backup" "$TARGET" || true; fi
  [[ -z "$stage" || ! -f "$stage" ]] || rm -f -- "$stage"
  [[ -z "$work_dir" || ! -d "$work_dir" ]] || rm -rf -- "$work_dir"
}
trap cleanup EXIT

while (($#)); do
  case "$1" in
    --dry-run) ;;
    --apply) apply=true ;;
    --commit) commit=true ;;
    --push) push=true ;;
    -h|--help) printf '%s\n' 'Usage: scripts/publish-suicide-corse-open-questions.sh [--dry-run] [--apply] [--commit] [--push]'; exit 0 ;;
    *) fail "unknown option: $1" ;;
  esac
  shift
done

if "$push" && ! "$commit"; then fail '--push requires --commit'; fi
if "$commit" && ! "$apply"; then fail '--commit requires --apply'; fi

for repository in "$UBIKIA_DIR" "$BARONS_MARIANI_DIR" "$SUICIDE_CORSE_SITE_DIR"; do
  [[ -d "$repository/.git" ]] || fail "not a Git checkout: $repository"
  git -C "$repository" diff --quiet || fail "working tree has tracked changes: $repository"
  git -C "$repository" diff --cached --quiet || fail "index has staged changes: $repository"
  [[ -z "$(git -C "$repository" ls-files --others --exclude-standard)" ]] || fail "working tree has untracked files: $repository"
done
[[ -f "$SOURCE" ]] || fail "missing source: $SOURCE"

if "$apply"; then
  git -C "$BARONS_MARIANI_DIR" pull --ff-only
  git -C "$UBIKIA_DIR" pull --ff-only
  git -C "$SUICIDE_CORSE_SITE_DIR" pull --ff-only
else
  printf '%s\n' 'Dry run: no repository will be changed.'
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/suicide-corse-open-questions.XXXXXX")"
rendered="$work_dir/questions-ouvertes.html"
source_commit="$(node "$UBIKIA_DIR/scripts/render-suicide-corse-open-questions.mjs" --source "$SOURCE" --source-repo "$BARONS_MARIANI_DIR" --output "$rendered")"
[[ "$source_commit" == "$(git -C "$BARONS_MARIANI_DIR" rev-parse HEAD)" ]] || fail 'renderer provenance is stale'
grep -Fq "data-source-commit=\"$source_commit\"" "$rendered" || fail 'rendered page lacks source provenance'
grep -Fq 'href="temoigner.html"' "$rendered" || fail 'rendered page lacks testimony link'
printf 'Validated open questions source commit: %s\n' "$source_commit"

if ! "$apply"; then exit 0; fi

stage="$(mktemp "$SUICIDE_CORSE_SITE_DIR/.questions-ouvertes.stage.XXXXXX")"
cp -- "$rendered" "$stage"
if [[ -f "$TARGET" ]]; then
  backup="$SUICIDE_CORSE_SITE_DIR/.questions-ouvertes.previous.$$.${RANDOM}"
  mv -- "$TARGET" "$backup"
fi
mv -- "$stage" "$TARGET"
stage=""
rm -f -- "$backup"
backup=""

git -C "$SUICIDE_CORSE_SITE_DIR" diff --check -- questions-ouvertes.html
git -C "$SUICIDE_CORSE_SITE_DIR" diff --stat -- questions-ouvertes.html
if "$commit"; then
  git -C "$SUICIDE_CORSE_SITE_DIR" add -- questions-ouvertes.html
  git -C "$SUICIDE_CORSE_SITE_DIR" commit -m "Update Suicide Corse open questions"
fi
if "$push"; then git -C "$SUICIDE_CORSE_SITE_DIR" push; fi
printf '%s\n' 'Artifact update complete. Fracta2 release promotion remains a separate Operium action.'
