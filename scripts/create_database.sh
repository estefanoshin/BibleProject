#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

IMAGE="mcr.microsoft.com/mssql/server:2022-latest"
CONTAINER_NAME="${MSSQL_CONTAINER_NAME:-BibleDatabase}"
PORT="${MSSQL_PORT:-1435}"
SA_PASSWORD="${MSSQL_SA_PASSWORD:-}"

if [ -z "${SA_PASSWORD}" ]; then
  echo "MSSQL_SA_PASSWORD is not set. Copy .env_template to .env and fill in credentials."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not available"
  exit 1
fi

container_host_port() {
  docker inspect -f '{{with (index (index .HostConfig.PortBindings "1433/tcp") 0)}}{{.HostPort}}{{end}}' "${CONTAINER_NAME}" 2>/dev/null || true
}

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  existing_port="$(container_host_port)"
  if [ "${existing_port}" != "${PORT}" ]; then
    echo "Recreating ${CONTAINER_NAME} to publish port ${PORT}"
    docker rm -f "${CONTAINER_NAME}" >/dev/null
  elif docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
    echo "Container ${CONTAINER_NAME} is already running on port ${PORT}"
    exit 0
  else
    echo "Starting existing container ${CONTAINER_NAME}"
    docker start "${CONTAINER_NAME}"
    exit 0
  fi
fi

echo "Creating container ${CONTAINER_NAME} from ${IMAGE}"
docker run -d \
  --name "${CONTAINER_NAME}" \
  --hostname "${CONTAINER_NAME}" \
  --platform linux/amd64 \
  -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" \
  -p "${PORT}:1433" \
  "${IMAGE}"

echo "SQL Server is available on localhost:${PORT} (user: sa)"
