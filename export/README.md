# Firestore Backup Utility

Backs up the `primefocus-workflow` Firestore database to local JSON files, organized by date and time.

## Setup

```bash
cd export
npm install
```

## Run a backup

```bash
npm run backup
```

Backups are written to `export/backup/YYYY-MM-DD_HH-MM-SS/`.

## Authentication

The script uses the service account key at the project root:

```
primefocus-workflow-438dcec8fc3a.json
```

You can override the path with the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run backup
```

## Output format

Each document is saved as a JSON file with its ID as the filename. Subcollections are nested under their parent document's folder. The JSON includes the document data plus `_id`, `_path`, `_createTime`, and `_updateTime` metadata.
