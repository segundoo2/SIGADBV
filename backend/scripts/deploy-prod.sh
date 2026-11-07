#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR/.."

export NODE_ENV=production

if [ -n "${ENV_FILE:-}" ]; then
  DEPLOY_ENV_FILE=$ENV_FILE
elif [ -f .env.production ]; then
  DEPLOY_ENV_FILE=.env.production
elif [ -f .env ]; then
  DEPLOY_ENV_FILE=.env
else
  DEPLOY_ENV_FILE=
fi

run_node_with_environment() {
  if [ -n "$DEPLOY_ENV_FILE" ]; then
    node --env-file="$DEPLOY_ENV_FILE" "$@"
  else
    node "$@"
  fi
}

pnpm run build
run_node_with_environment -e "
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'REDIS_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error('Variáveis obrigatórias ausentes: ' + missing.join(', '));
  require('./dist/src/common/environment.validation.js').validateEnvironment(process.env);
"
run_node_with_environment dist/src/database/prepare-production-schema.js
run_node_with_environment dist/src/database/seeds/run-create-admin.js

if [ -n "$DEPLOY_ENV_FILE" ]; then
  exec node --env-file="$DEPLOY_ENV_FILE" dist/src/main.js
fi
exec node dist/src/main.js
