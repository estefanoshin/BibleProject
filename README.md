# Biblia

A Spanish Bible reader: a React web app (also packaged with Capacitor for iOS and Android) and a Spring Boot API backed by SQL Server.

You can browse versions, books, and chapters, read verses, and mark chapters as read (stored in the browser). Bundled CSV translations:

- **Reina-Valera 1960** (`RV-1960`)
- **Reina-Valera Actualizada 2015** (`RVA-2015`)
- **Dios Habla Hoy** (`DHH`)
- **Nueva Versión Internacional** (`NVI`)
- **Nueva Traducción Viviente** (`NTV`)
- **King James Version** (`KJV`)
- **New Living Translation** (`NLT`)
- **Korean** (`KOERV`, `KLB`)

## Layout

| Path | What it is |
| --- | --- |
| `frontend/` | React + Vite UI (`Biblia`), Capacitor iOS/Android projects |
| `BibleAPI/` | Spring Boot 4 API (Java 21), OpenAPI / Swagger UI |
| `frontend/public/resources/` | CSV source data bundled with the web app |
| `scripts/` | SQL Server container, CSV import, Capacitor helpers |
| `Taskfile.yml` | Common local commands |

## Prerequisites

- [Go Task](https://taskfile.dev/) (`task`)
- [nvm](https://github.com/nvm-sh/nvm) with **Node 20.19.2** (`nvm install 20.19.2`)
- pnpm (frontend `task start`)
- Docker
- Java 21 (or use `BibleAPI/mvnw`, which downloads Maven)
- For native apps: Xcode (iOS Simulator) and/or Android Studio + SDK (emulator)

## First-time setup

### 1. Environment

```bash
cp .env_template .env
```

Fill in SQL Server credentials. The API and import scripts read this file. Typical local values:

- `MSSQL_HOST=localhost`
- `MSSQL_PORT=1435`
- `MSSQL_USER=sa`
- `MSSQL_DATABASE=master`
- `MSSQL_CONTAINER_NAME=BibleDatabase`

Set `MSSQL_SA_PASSWORD` to a password that meets SQL Server complexity rules. Do not commit `.env`.

### 2. Database

Start SQL Server 2022 in Docker (host port `1435` by default):

```bash
./scripts/create_database.sh
```

Load translations. **Run RV-1960 first** — that script recreates `books`, `chapters`, and `versicles`. The other insert scripts load alongside it without wiping existing versions:

```bash
./scripts/insert_rv1960.sh
./scripts/insert_rva2015.sh
./scripts/insert_dhh.sh
./scripts/insert_nvi.sh
./scripts/insert_ntv.sh
./scripts/insert_kjv.sh
./scripts/insert_nlt.sh
./scripts/insert_koerv.sh
./scripts/insert_klb.sh
```

Or load several folders at once:

```bash
./scripts/insert_version.sh RVA2015 DHH NVI NTV KJV NLT KOERV KLB
```

Verse text is stored gzip-compressed in SQL Server.

### 3. API

Run from `BibleAPI/` (port **5010**). It loads `../.env` for the datasource.

```bash
cd BibleAPI
./mvnw spring-boot:run
```

Or package and run the API in Docker (SQL Server stays on the host; the container uses `host.docker.internal`):

```bash
task deploy-api
```

- Health: http://localhost:5010/api/health
- Swagger UI: http://localhost:5010/swagger-ui.html
- OpenAPI JSON: http://localhost:5010/v3/api-docs

### 4. Frontend

With the API running:

```bash
task start
```

Opens the Vite dev server at http://localhost:3000. `/api` is proxied to `http://localhost:5010`.

Production-style builds can point at the API with `VITE_API_URL` (defaults to `http://localhost:5010` when not in Vite dev mode).

## Daily commands

```bash
task              # list tasks
task start        # Vite on :3000
task deploy-api   # Maven package + Docker Compose for BibleAPI
task ios          # build web app, sync Capacitor, run on iOS Simulator
task android      # build web app, sync Capacitor, run on Android emulator
```

`task ios` / `task android` expect Node at `~/.nvm/versions/node/v20.19.2/bin`. Override the Android AVD with `ANDROID_AVD`, or pick an iOS simulator with `IOS_SIMULATOR`.

## Fetching a Bible Gateway version

`scripts/scrapper/fetch.py` downloads a translation from Bible Gateway and writes CSVs the frontend can bundle. It needs Python 3.

```bash
python scripts/scrapper/fetch.py
```

The script prints `Input version to fetch`. Enter the Bible Gateway version code (for example `NVI`, `DHH`). That value is used as:

- the `version` query sent to Bible Gateway
- the `version` column in `books.csv`
- the output folder name under `frontend/public/resources/`

Example for `NVI`:

- `frontend/public/resources/NVI/books.csv`
- `frontend/public/resources/NVI/chapters.csv`
- `frontend/public/resources/NVI/versicles.csv`

HTML responses are cached under `/tmp/bible_custom_cache` (keyed by version, book, and chapter).

`scripts/scrapper/fetch_rva2015.py` is the same scraper with **RVA-2015** hardcoded; use `fetch.py` for any other version.

## HTTP API

All Bible routes are under `/api`. CORS allows the Vite origin and Capacitor.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness (`{"status":"UP"}`) |
| `GET` | `/api/versions` | Installed versions |
| `GET` | `/api/versions/{version}/books` | Books in a version |
| `GET` | `/api/books/{bookId}` | One book |
| `GET` | `/api/books/{bookId}/chapters` | Chapters in a book |
| `GET` | `/api/chapters/{chapterId}` | One chapter |
| `GET` | `/api/chapters/{chapterId}/verses` | Verses plus previous/next chapter ids |
| `GET` | `/api/verses/{verseId}` | One verse |

Actuator exposes `/actuator/health` and `/actuator/info`.

## Tests

API tests use H2 (profile `test`); they do not need SQL Server:

```bash
cd BibleAPI
./mvnw test
```

Frontend lint:

```bash
cd frontend
pnpm lint
```
