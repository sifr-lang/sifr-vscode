#!/usr/bin/env bash
# Provision the independently pinned npm in a caller-owned directory.
# Select .node-version first. Print only the resulting PATH entry on stdout.
set -euo pipefail

extension_root="$(cd "$(dirname "$0")/.." && pwd)"
npm_prefix="${1:?usage: setup-npm.sh <absolute-private-prefix>}"
if [[ "${npm_prefix}" != /* || "${npm_prefix}" == / ]]; then
  echo "npm prefix must be an absolute private directory" >&2
  exit 2
fi
node_version="$(tr -d '\r\n' < "${extension_root}/.node-version")"
if ! command -v node >/dev/null || [[ "$(node --version)" != "v${node_version}" ]]; then
  echo "Node toolchain mismatch: select Node ${node_version} from .node-version before provisioning npm" >&2
  exit 1
fi
package_manager="$(node -p 'require(process.argv[1]).packageManager' "${extension_root}/package.json")"
if [[ ! "${package_manager}" =~ ^npm@[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "packageManager must select one exact npm release" >&2
  exit 1
fi
if ! command -v npm >/dev/null; then
  echo "npm bootstrap executable missing; use the selected Node distribution's bundled npm" >&2
  exit 1
fi
mkdir -p "${npm_prefix}"
(
  cd "${npm_prefix}"
  npm install --prefix "${npm_prefix}" --no-package-lock --ignore-scripts \
    --no-audit --no-fund "${package_manager}" >&2
)
actual="$("${npm_prefix}/node_modules/.bin/npm" --version)"
if [[ "${actual}" != "${package_manager#npm@}" ]]; then
  echo "npm provisioning mismatch: expected ${package_manager#npm@}, found ${actual}" >&2
  exit 1
fi
printf '%s\n' "${npm_prefix}/node_modules/.bin"
