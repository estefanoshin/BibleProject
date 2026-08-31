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
MSSQL_USER="${MSSQL_USER:-sa}"
DATABASE="${MSSQL_DATABASE:-master}"

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
  else
    echo "Starting existing container ${CONTAINER_NAME}"
    docker start "${CONTAINER_NAME}"
  fi
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "Creating container ${CONTAINER_NAME} from ${IMAGE}"
  docker run -d \
    --name "${CONTAINER_NAME}" \
    --hostname "${CONTAINER_NAME}" \
    --platform linux/amd64 \
    -e "ACCEPT_EULA=Y" \
    -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" \
    -p "${PORT}:1433" \
    "${IMAGE}"
fi

SQLCMD=""
for candidate in /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd; do
  if docker exec "${CONTAINER_NAME}" test -x "${candidate}"; then
    SQLCMD="${candidate}"
    break
  fi
done

if [ -z "${SQLCMD}" ]; then
  echo "sqlcmd was not found inside ${CONTAINER_NAME}"
  exit 1
fi

run_sql() {
  docker exec -i \
    -e SQLCMDPASSWORD="${SA_PASSWORD}" \
    "${CONTAINER_NAME}" \
    "${SQLCMD}" -S localhost -U "${MSSQL_USER}" -d "${DATABASE}" -C -b -r1
}

echo "Waiting for SQL Server in ${CONTAINER_NAME}"
ready=0
for _ in $(seq 1 60); do
  if echo "SELECT 1;" | run_sql >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "${ready}" -ne 1 ]; then
  echo "SQL Server did not become ready"
  exit 1
fi

echo "Creating tables in ${DATABASE} if they do not exist"
run_sql <<'SQL'
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.books', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.books (
    book_id INT NOT NULL CONSTRAINT PK_books PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    version NVARCHAR(50) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.chapters', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.chapters (
    chapter_id INT NOT NULL CONSTRAINT PK_chapters PRIMARY KEY,
    book_id INT NOT NULL,
    cNum INT NOT NULL,
    CONSTRAINT FK_chapters_book FOREIGN KEY (book_id) REFERENCES dbo.books (book_id)
  );
END;

IF OBJECT_ID(N'dbo.versicles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.versicles (
    versicle_id INT NOT NULL CONSTRAINT PK_versicles PRIMARY KEY,
    book_id INT NOT NULL,
    chapter_id INT NOT NULL,
    vNum INT NOT NULL,
    text_value VARBINARY(MAX) NULL,
    CONSTRAINT FK_versicles_book FOREIGN KEY (book_id) REFERENCES dbo.books (book_id),
    CONSTRAINT FK_versicles_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters (chapter_id)
  );
END;

IF OBJECT_ID(N'dbo.comments', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.comments (
    comment_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_comments PRIMARY KEY,
    versicle_id INT NOT NULL,
    comment NVARCHAR(MAX) NOT NULL,
    version NVARCHAR(50) NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT DF_comments_date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_comments_versicle FOREIGN KEY (versicle_id) REFERENCES dbo.versicles (versicle_id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.saved_passages', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.saved_passages (
    passage_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_saved_passages PRIMARY KEY,
    version NVARCHAR(50) NOT NULL,
    book_id INT NOT NULL,
    chapter_id INT NOT NULL,
    canonical_book_id INT NOT NULL,
    chapter_number INT NOT NULL,
    book_name NVARCHAR(200) NOT NULL,
    reference NVARCHAR(400) NOT NULL,
    verses_json NVARCHAR(MAX) NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT DF_saved_passages_date DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID(N'dbo.read_chapters', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.read_chapters (
    canonical_book_id INT NOT NULL,
    chapter_number INT NOT NULL,
    CONSTRAINT PK_read_chapters PRIMARY KEY (canonical_book_id, chapter_number)
  );
END;

IF OBJECT_ID(N'dbo.book_chapter_numbers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.book_chapter_numbers (
    canonical_book_id INT NOT NULL,
    chapter_number INT NOT NULL,
    CONSTRAINT PK_book_chapter_numbers PRIMARY KEY (canonical_book_id, chapter_number)
  );
END;
SQL

echo "SQL Server is available on localhost:${PORT} (user: sa)"
echo "Tables: books, chapters, versicles, comments, saved_passages, read_chapters, book_chapter_numbers"
