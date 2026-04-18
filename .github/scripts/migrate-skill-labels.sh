#!/usr/bin/env bash
# migrate-skill-labels.sh — One-time relabeling of existing open issues
#
# Renames bare difficulty labels (beginner, intermediate, advanced) to their
# new "skill: *" equivalents. Run with DRY_RUN=true (default) to preview.
#
# Usage:
#   DRY_RUN=true  bash .github/scripts/migrate-skill-labels.sh   # preview
#   DRY_RUN=false bash .github/scripts/migrate-skill-labels.sh   # execute
#
# NOTE: Requires bash 4+ for associative arrays (declare -A).
# GitHub Actions runners use bash 5. macOS ships bash 3.2 by default —
# use 'brew install bash' or rewrite LABEL_MAP as parallel arrays if
# running locally on an unmodified Mac.
#
# IMPORTANT: Disable label-triggered workflows (bot-coderabbit-plan-trigger,
# bot-advanced-check) BEFORE running this script to avoid webhook spam.
set -euo pipefail

if (( BASH_VERSINFO[0] < 4 )); then
  echo "ERROR: bash 4+ required (found $BASH_VERSION). See script header for details."
  exit 1
fi

DRY_RUN="${DRY_RUN:-true}"
REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "Migration script for skill labels"
echo "  Repo:    $REPO"
echo "  Dry run: $DRY_RUN"
echo ""

declare -A LABEL_MAP=(
  ["beginner"]="skill: beginner"
  ["intermediate"]="skill: intermediate"
  ["advanced"]="skill: advanced"
)

# Ensure target labels exist (no-op if already present).
if [[ "$DRY_RUN" != "true" ]]; then
  echo "Ensuring target labels exist..."
  for new_label in "${LABEL_MAP[@]}"; do
    gh label create "$new_label" --repo "$REPO" --force 2>/dev/null || true
  done
  echo ""
fi

failures=0

for old_label in "${!LABEL_MAP[@]}"; do
  new_label="${LABEL_MAP[$old_label]}"
  echo "=== Migrating '$old_label' → '$new_label' ==="

  if ! issues=$(gh issue list --repo "$REPO" --label "$old_label" --state open --limit 1000 --search "is:issue" --json number -q '.[].number' 2>&1); then
    echo "  ❌ ERROR: gh issue list failed for '$old_label': $issues"
    failures=$((failures + 1))
    continue
  fi

  if [[ -z "$issues" ]]; then
    echo "  Found 0 open issue(s) with label '$old_label'"
    continue
  fi

  count=$(echo "$issues" | wc -l)
  echo "  Found $count open issue(s) with label '$old_label'"

  for num in $issues; do
    echo "  Issue #$num"
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "    [dry-run] Would add '$new_label' and remove '$old_label'"
    else
      if ! gh issue edit "$num" --repo "$REPO" --add-label "$new_label" --remove-label "$old_label"; then
        echo "    ❌ Failed to migrate issue #$num"
        failures=$((failures + 1))
      else
        echo "    ✅ Migrated"
      fi
    fi
  done
done

if (( failures > 0 )); then
  echo ""
  echo "⚠️  $failures error(s) occurred during migration. Review output above."
  exit 1
fi
echo ""
echo "✅ Migration complete."
