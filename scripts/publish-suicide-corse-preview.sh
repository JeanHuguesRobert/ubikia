#!/usr/bin/env bash
# Render and stage a traceable Suicide Corse preview. It never publishes unless
# the operator explicitly requests --push after reviewing the local diff.
set -euo pipefail

readonly RELEASE_ID="${SUICIDE_CORSE_RELEASE_ID:-2026-09-17}"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly UBIKIA_DIR="${UBIKIA_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
readonly BARONS_MARIANI_DIR="${BARONS_MARIANI_DIR:-$(cd "$UBIKIA_DIR/../barons-Mariani" && pwd)}"
readonly SUICIDE_CORSE_SITE_DIR="${SUICIDE_CORSE_SITE_DIR:-$(cd "$UBIKIA_DIR/../suicide-corse" && pwd)}"
readonly CORPUS_PATH="$BARONS_MARIANI_DIR/projects/suicide-corse/corpus.yml"
readonly PROJECTION_PATH="$BARONS_MARIANI_DIR/projects/suicide-corse/projections/book-2026-09-17-anniversaire.yml"
readonly TARGET_DIR="$SUICIDE_CORSE_SITE_DIR/editions/$RELEASE_ID"

apply=false
commit=false
push=false
work_dir=""
stage_dir=""
backup_dir=""

usage() {
  cat <<'EOF'
Usage: scripts/publish-suicide-corse-preview.sh [--dry-run] [--apply] [--commit] [--push]

  --dry-run  Render and validate a fresh preview, without changing any repository (default).
  --apply    Replace only editions/2026-09-17 in the artifact repository after validation.
  --commit   Commit that replacement after showing the repository diff (requires --apply).
  --push     Push that commit to its configured Git remote (requires --commit).

Repository paths may be supplied through UBIKIA_DIR, BARONS_MARIANI_DIR and
SUICIDE_CORSE_SITE_DIR. The default layout expects sibling checkouts named
ubikia, barons-Mariani and suicide-corse.
EOF
}

fail() {
  printf 'publish-suicide-corse-preview: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "$backup_dir" && -d "$backup_dir" && ! -d "$TARGET_DIR" ]]; then
    mv -- "$backup_dir" "$TARGET_DIR" || true
  fi
  [[ -z "$stage_dir" || ! -d "$stage_dir" ]] || rm -rf -- "$stage_dir"
  [[ -z "$work_dir" || ! -d "$work_dir" ]] || rm -rf -- "$work_dir"
}
trap cleanup EXIT

while (($#)); do
  case "$1" in
    --dry-run) ;;
    --apply) apply=true ;;
    --commit) commit=true ;;
    --push) push=true ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; fail "unknown option: $1" ;;
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

[[ -f "$CORPUS_PATH" ]] || fail "missing corpus: $CORPUS_PATH"
[[ -f "$PROJECTION_PATH" ]] || fail "missing projection: $PROJECTION_PATH"
[[ "$TARGET_DIR" == "$SUICIDE_CORSE_SITE_DIR/editions/$RELEASE_ID" ]] || fail 'unsafe target directory'

if "$apply"; then
  for repository in "$BARONS_MARIANI_DIR" "$UBIKIA_DIR" "$SUICIDE_CORSE_SITE_DIR"; do
    git -C "$repository" pull --ff-only
  done
else
  printf '%s\n' 'Dry run: no git pull, artifact replacement, commit or push will occur.'
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/suicide-corse-preview.XXXXXX")"
build_dir="$work_dir/render"
(
  cd "$UBIKIA_DIR"
  npm run render -- --corpus "$CORPUS_PATH" --projection "$PROJECTION_PATH" --output "$build_dir"
)

manifest="$build_dir/manifest.json"
[[ -f "$manifest" ]] || fail 'renderer did not produce manifest.json'
mapfile -t manifest_values < <(node - "$manifest" <<'NODE'
const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (manifest.publication_status !== 'draft') throw new Error('preview manifest must remain draft');
const required = ['html', 'pdf'];
const paths = Object.fromEntries((manifest.outputs ?? []).map((output) => [output.format, output.path]));
for (const format of required) {
  if (typeof paths[format] !== 'string' || !paths[format]) throw new Error(`manifest lacks ${format} output`);
  if (paths[format].startsWith('/') || paths[format].split('/').includes('..')) throw new Error(`unsafe ${format} path`);
}
if (!manifest.source_git_commit) throw new Error('manifest lacks source_git_commit');
console.log(paths.html);
console.log(paths.pdf);
console.log(manifest.source_git_commit);
NODE
) || fail 'invalid preview manifest'

html_path="${manifest_values[0]:-}"
pdf_path="${manifest_values[1]:-}"
source_commit="${manifest_values[2]:-}"
[[ -f "$build_dir/$html_path" ]] || fail "missing rendered HTML: $html_path"
[[ -f "$build_dir/$pdf_path" ]] || fail "missing rendered PDF: $pdf_path"
[[ "$source_commit" == "$(git -C "$BARONS_MARIANI_DIR" rev-parse HEAD)" ]] || fail 'manifest source commit is not the current Corpus revision'
printf 'Validated preview source commit: %s\n' "$source_commit"
printf 'Validated rendered PDF: %s\n' "$pdf_path"

if ! "$apply"; then
  printf 'Dry run complete. No repository was changed.\n'
  exit 0
fi

release_parent="$(dirname "$TARGET_DIR")"
mkdir -p -- "$release_parent"
stage_dir="$(mktemp -d "$release_parent/.${RELEASE_ID}.stage.XXXXXX")"
cp -a -- "$build_dir/_book/." "$stage_dir/"
cp -- "$manifest" "$stage_dir/manifest.json"

printf '%s\n' 'Planned artifact-repository diff:'
if [[ -d "$TARGET_DIR" ]]; then
  git -C "$SUICIDE_CORSE_SITE_DIR" diff --no-index --stat -- "$TARGET_DIR" "$stage_dir" || true
else
  git -C "$SUICIDE_CORSE_SITE_DIR" diff --no-index --stat -- /dev/null "$stage_dir" || true
fi

if [[ -d "$TARGET_DIR" ]]; then
  backup_dir="$release_parent/.${RELEASE_ID}.previous.$$.${RANDOM}"
  mv -- "$TARGET_DIR" "$backup_dir"
fi
mv -- "$stage_dir" "$TARGET_DIR"
stage_dir=""
rm -rf -- "$backup_dir"
backup_dir=""

git -C "$SUICIDE_CORSE_SITE_DIR" diff --check
printf '%s\n' 'Artifact repository diff after replacement:'
git -C "$SUICIDE_CORSE_SITE_DIR" diff --stat -- "editions/$RELEASE_ID"

if "$commit"; then
  git -C "$SUICIDE_CORSE_SITE_DIR" add -- "editions/$RELEASE_ID"
  git -C "$SUICIDE_CORSE_SITE_DIR" commit -m "Update Suicide Corse preview $RELEASE_ID"
fi
if "$push"; then
  git -C "$SUICIDE_CORSE_SITE_DIR" push
fi

printf '%s\n' 'Preview staging complete. GitHub Pages propagation, if pushed, remains externally verified separately.'
