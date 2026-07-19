#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ROOT_KEY = path.join(__dirname, '..', 'primefocus-workflow-438dcec8fc3a.json')
const SERVICE_ACCOUNT_PATH = fs.existsSync(PROJECT_ROOT_KEY)
  ? PROJECT_ROOT_KEY
  : process.env.GOOGLE_APPLICATION_CREDENTIALS
const BACKUP_ROOT = path.join(__dirname, 'backup')

function timestampFolderName() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_')
}

async function backupCollection(collectionRef, backupPath) {
  const snapshot = await collectionRef.get()

  if (snapshot.empty) {
    return
  }

  fs.mkdirSync(backupPath, { recursive: true })

  for (const doc of snapshot.docs) {
    const docPath = path.join(backupPath, `${sanitizeFileName(doc.id)}.json`)
    const data = {
      _id: doc.id,
      _path: doc.ref.path,
      _createTime: doc.createTime?.toDate()?.toISOString?.() || null,
      _updateTime: doc.updateTime?.toDate()?.toISOString?.() || null,
      ...doc.data(),
    }

    fs.writeFileSync(docPath, JSON.stringify(data, null, 2))

    const subcollections = await doc.ref.listCollections()
    for (const subcollection of subcollections) {
      await backupCollection(
        subcollection,
        path.join(backupPath, sanitizeFileName(doc.id), subcollection.id)
      )
    }
  }
}

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Service account key not found: ${SERVICE_ACCOUNT_PATH}`)
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS or place the key file in the project root.')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))

  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  })

  const db = getFirestore()
  const backupFolder = path.join(BACKUP_ROOT, timestampFolderName())

  fs.mkdirSync(backupFolder, { recursive: true })

  console.log(`Starting backup to: ${backupFolder}`)

  const collections = await db.listCollections()
  for (const collection of collections) {
    console.log(`Backing up collection: ${collection.id}`)
    await backupCollection(collection, path.join(backupFolder, collection.id))
  }

  console.log(`Backup complete: ${backupFolder}`)
}

main().catch((error) => {
  console.error('Backup failed:', error)
  process.exit(1)
})
