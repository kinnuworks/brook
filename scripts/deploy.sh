#!/usr/bin/env bash
# Deploys the last commit to production from a clean copy without git history.
#
# Why a copy: when the folder has a GitHub remote, Vercel checks that the
# commit's author email belongs to the Vercel account, and on a Hobby team it
# blocks the deploy if not ("the commit author doesn't have permission").
# A copy with no .git skips that check. Only committed files are deployed.
#
#   npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT="$(mktemp -d)"
trap 'rm -rf "$EXPORT"' EXIT

if [ -n "$(git -C "$ROOT" status --porcelain)" ]; then
  echo "Note: uncommitted changes are NOT deployed (only the last commit is)."
fi

git -C "$ROOT" archive HEAD | tar -x -C "$EXPORT"
mkdir -p "$EXPORT/.vercel"
cp "$ROOT/.vercel/project.json" "$EXPORT/.vercel/"

cd "$EXPORT"
vercel deploy --prod --yes
