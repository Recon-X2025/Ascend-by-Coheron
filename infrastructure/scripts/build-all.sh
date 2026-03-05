#!/usr/bin/env bash
# Full build: packages, API, Web. Use from repo root.
set -e
cd "$(dirname "$0")/../.."
npm run build:packages 2>/dev/null || true
npm run build:api 2>/dev/null || (cd apps/api && npm run build)
npm run build:web 2>/dev/null || (cd apps/web && npm run build)
echo "Build complete."
