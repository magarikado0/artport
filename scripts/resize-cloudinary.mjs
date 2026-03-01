/**
 * Firestore に保存済みの Cloudinary 画像 URL に変換パラメータを挿入するスクリプト
 *
 * Cloudinary の URL変換（CDNレベル）を使うため、APIキー不要
 *
 * 使い方:
 *   node scripts/resize-cloudinary.mjs
 *
 * 変換内容:
 *   https://res.cloudinary.com/.../image/upload/v123/file.jpg
 *   → https://res.cloudinary.com/.../image/upload/c_limit,w_1200,h_1200,q_85,f_auto/v123/file.jpg
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

// .env.local を手動で読み込む
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
})

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID
const API_KEY = process.env.VITE_FIREBASE_API_KEY

// Cloudinary URL に変換パラメータを挿入する
// 例: .../upload/v123/... → .../upload/c_limit,w_1200,h_1200,q_85,f_auto/v123/...
const TRANSFORM = 'c_limit,w_1200,h_1200,q_85,f_auto'

function addTransform(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url
  if (url.includes(TRANSFORM)) return url // すでに適用済み
  return url.replace('/image/upload/', `/image/upload/${TRANSFORM}/`)
}

// Firestore REST API でドキュメント一覧取得
function firestoreList(collection, pageToken = null) {
  return new Promise((resolve, reject) => {
    let path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=100&key=${API_KEY}`
    if (pageToken) path += `&pageToken=${pageToken}`

    const req = https.request({ hostname: 'firestore.googleapis.com', path, method: 'GET' }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    req.end()
  })
}

// Firestore REST API でドキュメント更新（PATCHリクエスト）
function firestorePatch(docPath, fields) {
  return new Promise((resolve, reject) => {
    const fieldMask = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&')
    const body = JSON.stringify({ fields })
    const reqPath = `/v1/${docPath}?${fieldMask}&key=${API_KEY}`

    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: reqPath,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// コレクション全件取得
async function getAllDocs(collection) {
  const all = []
  let pageToken = null
  do {
    const result = await firestoreList(collection, pageToken)
    if (result.documents) all.push(...result.documents)
    pageToken = result.nextPageToken || null
  } while (pageToken)
  return all
}

// Firestore の文字列フィールドを取得
function getString(doc, field) {
  return doc.fields?.[field]?.stringValue || ''
}

async function main() {
  let updated = 0
  let skipped = 0

  // artworks コレクション
  console.log('📂 artworks を処理中...')
  const artworks = await getAllDocs('artworks')
  for (const doc of artworks) {
    const original = getString(doc, 'imageUrl')
    const transformed = addTransform(original)
    if (original === transformed) { skipped++; continue }

    const docPath = doc.name.replace('https://firestore.googleapis.com/v1/', '')
    await firestorePatch(docPath, { imageUrl: { stringValue: transformed } })
    console.log(`  ✅ ${doc.name.split('/').pop()}: URL更新`)
    updated++
  }

  // exhibitions コレクション
  console.log('📂 exhibitions を処理中...')
  const exhibitions = await getAllDocs('exhibitions')
  for (const doc of exhibitions) {
    const original = getString(doc, 'coverUrl')
    const transformed = addTransform(original)
    if (original === transformed) { skipped++; continue }

    const docPath = doc.name.replace('https://firestore.googleapis.com/v1/', '')
    await firestorePatch(docPath, { coverUrl: { stringValue: transformed } })
    console.log(`  ✅ ${doc.name.split('/').pop()}: URL更新`)
    updated++
  }

  console.log(`\n🎉 完了: 更新 ${updated}件 / スキップ ${skipped}件`)
}

main().catch(console.error)
