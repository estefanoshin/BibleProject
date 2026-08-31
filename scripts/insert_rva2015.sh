#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CSV_DIR="${ROOT_DIR}/resources/RVA2015"
IMPORT_DIR="/var/opt/mssql/import/RVA2015"
VERSION="RVA-2015"

if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

CONTAINER_NAME="${MSSQL_CONTAINER_NAME:-BibleDatabase}"
MSSQL_USER="${MSSQL_USER:-sa}"
SA_PASSWORD="${MSSQL_SA_PASSWORD:-}"
DATABASE="${MSSQL_DATABASE:-master}"

if [ -z "${SA_PASSWORD}" ]; then
  echo "MSSQL_SA_PASSWORD is not set. Copy .env_template to .env and fill in credentials."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not available"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "Container ${CONTAINER_NAME} is not running. Start it with scripts/create_database.sh"
  exit 1
fi

for csv in books.csv chapters.csv versicles.csv; do
  if [ ! -f "${CSV_DIR}/${csv}" ]; then
    echo "Missing ${CSV_DIR}/${csv}"
    exit 1
  fi
done

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

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

to_utf16() {
  local src="$1"
  local dest="$2"
  python3 - "${src}" "${dest}" <<'PY'
import sys
src, dest = sys.argv[1], sys.argv[2]
data = open(src, "r", encoding="utf-8").read().encode("utf-16-le")
open(dest, "wb").write(b"\xff\xfe" + data)
PY
}

python3 - "${CSV_DIR}/versicles.csv" "${TMP_DIR}/versicles.csv" <<'PY'
import csv
import gzip
import sys

src, dest = sys.argv[1], sys.argv[2]
with open(src, encoding="utf-8-sig", newline="") as infile, open(
    dest, "w", encoding="utf-8", newline=""
) as outfile:
    reader = csv.DictReader(infile)
    writer = csv.writer(outfile, lineterminator="\n")
    writer.writerow(["versicle_id", "book_id", "chapter_id", "vNum", "text_hex"])
    for row in reader:
        text = row.get("text_value") or ""
        compressed = gzip.compress(text.encode("utf-8"))
        writer.writerow(
            [
                row["versicle_id"],
                row["book_id"],
                row["chapter_id"],
                row["vNum"],
                compressed.hex(),
            ]
        )
PY

to_utf16 "${CSV_DIR}/books.csv" "${TMP_DIR}/books.csv"
to_utf16 "${CSV_DIR}/chapters.csv" "${TMP_DIR}/chapters.csv"

echo "Copying CSVs into ${CONTAINER_NAME}:${IMPORT_DIR}"
docker exec -u root "${CONTAINER_NAME}" mkdir -p "${IMPORT_DIR}"
docker cp "${TMP_DIR}/books.csv" "${CONTAINER_NAME}:${IMPORT_DIR}/books.csv"
docker cp "${TMP_DIR}/chapters.csv" "${CONTAINER_NAME}:${IMPORT_DIR}/chapters.csv"
docker cp "${TMP_DIR}/versicles.csv" "${CONTAINER_NAME}:${IMPORT_DIR}/versicles.csv"
docker exec -u root "${CONTAINER_NAME}" chown -R mssql:mssql /var/opt/mssql/import

echo "Ensuring tables exist and loading ${VERSION} into ${DATABASE}"
run_sql <<SQL
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

IF OBJECT_ID(N'dbo.versicles_staging', N'U') IS NOT NULL DROP TABLE dbo.versicles_staging;
IF OBJECT_ID(N'dbo.books_staging', N'U') IS NOT NULL DROP TABLE dbo.books_staging;
IF OBJECT_ID(N'dbo.chapters_staging', N'U') IS NOT NULL DROP TABLE dbo.chapters_staging;

DELETE v
FROM dbo.versicles AS v
INNER JOIN dbo.books AS b ON b.book_id = v.book_id
WHERE b.version = N'${VERSION}';

DELETE c
FROM dbo.chapters AS c
INNER JOIN dbo.books AS b ON b.book_id = c.book_id
WHERE b.version = N'${VERSION}';

DELETE FROM dbo.books WHERE version = N'${VERSION}';

CREATE TABLE dbo.books_staging (
  book_id INT NOT NULL,
  name NVARCHAR(200) NOT NULL,
  version NVARCHAR(50) NOT NULL
);

CREATE TABLE dbo.chapters_staging (
  chapter_id INT NOT NULL,
  book_id INT NOT NULL,
  cNum INT NOT NULL
);

CREATE TABLE dbo.versicles_staging (
  versicle_id INT NOT NULL,
  book_id INT NOT NULL,
  chapter_id INT NOT NULL,
  vNum INT NOT NULL,
  text_hex VARCHAR(MAX) NULL
);

BULK INSERT dbo.books_staging
FROM '${IMPORT_DIR}/books.csv'
WITH (FORMAT = 'CSV', DATAFILETYPE = 'widechar', FIRSTROW = 2, TABLOCK, KEEPNULLS);

BULK INSERT dbo.chapters_staging
FROM '${IMPORT_DIR}/chapters.csv'
WITH (FORMAT = 'CSV', DATAFILETYPE = 'widechar', FIRSTROW = 2, TABLOCK, KEEPNULLS);

BULK INSERT dbo.versicles_staging
FROM '${IMPORT_DIR}/versicles.csv'
WITH (FORMAT = 'CSV', FIRSTROW = 2, TABLOCK, KEEPNULLS);

DECLARE @book_off INT = ISNULL((SELECT MAX(book_id) FROM dbo.books), 0);
DECLARE @chapter_off INT = ISNULL((SELECT MAX(chapter_id) FROM dbo.chapters), 0);
DECLARE @verse_off INT = ISNULL((SELECT MAX(versicle_id) FROM dbo.versicles), 0);

INSERT INTO dbo.books (book_id, name, version)
SELECT book_id + @book_off, name, version FROM dbo.books_staging;

INSERT INTO dbo.chapters (chapter_id, book_id, cNum)
SELECT chapter_id + @chapter_off, book_id + @book_off, cNum FROM dbo.chapters_staging;

INSERT INTO dbo.versicles (versicle_id, book_id, chapter_id, vNum, text_value)
SELECT
  versicle_id + @verse_off,
  book_id + @book_off,
  chapter_id + @chapter_off,
  vNum,
  CONVERT(VARBINARY(MAX), ISNULL(text_hex, ''), 2)
FROM dbo.versicles_staging;

DROP TABLE dbo.versicles_staging;
DROP TABLE dbo.chapters_staging;
DROP TABLE dbo.books_staging;

SELECT
  (SELECT COUNT(*) FROM dbo.books WHERE version = N'${VERSION}') AS books,
  (SELECT COUNT(*) FROM dbo.chapters c INNER JOIN dbo.books b ON b.book_id = c.book_id WHERE b.version = N'${VERSION}') AS chapters,
  (SELECT COUNT(*) FROM dbo.versicles v INNER JOIN dbo.books b ON b.book_id = v.book_id WHERE b.version = N'${VERSION}') AS versicles;
SQL

echo "${VERSION} tables updated and CSV data inserted"
