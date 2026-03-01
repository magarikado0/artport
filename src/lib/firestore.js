import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import axios from 'axios'
import { db } from './firebase'

// Cloudinary の設定
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dtanz2zfw/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'database'

// Firestore の設定
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// モックデータ
const MOCK_EXHIBITIONS = [
  { id: '1', title: '東大書道部 春季展覧会', venue: '東京大学 本郷キャンパス 山上会館', genre: ['書道'], startDate: new Date('2026-03-10'), endDate: new Date('2026-03-15'), artworkCount: 24, status: '開催中', coverBg: 'linear-gradient(135deg,#e8e0d0,#d4c8b4)', symbol: '書' },
  { id: '2', title: '光の記憶 — 写真展 2026', venue: '早稲田大学 大隈記念館', genre: ['写真'], startDate: new Date('2026-03-08'), endDate: new Date('2026-03-14'), artworkCount: 38, status: '開催中', coverBg: 'linear-gradient(135deg,#d4dce8,#c0ccd8)', symbol: '📷' },
  { id: '3', title: '土と声 — 陶芸作品展', venue: '多摩美術大学 芸術祭会場', genre: ['陶芸'], startDate: new Date('2026-03-20'), endDate: new Date('2026-03-25'), artworkCount: 16, status: '近日開催', coverBg: 'linear-gradient(135deg,#e8ddd4,#d4c4b4)', symbol: '🏺' },
]

const MOCK_ARTWORKS = [
  { id: '1', title: '静寂の筆跡', artistName: '山田 碧', genre: '書道', imageUrl: '', exhibitionTitle: '東大書道部 春季展', tall: true },
  { id: '2', title: '光の記憶', artistName: '田中 光', genre: '写真', imageUrl: '' },
  { id: '3', title: '器の声', artistName: '鈴木 陶子', genre: '陶芸', imageUrl: '' },
]

// ── Artworks ──────────────────────────────
export async function fetchArtworks(genreFilter = null) {
  if (USE_MOCK_DATA) {
    return MOCK_ARTWORKS
  }
  let q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'))
  if (genreFilter) {
    q = query(
      collection(db, 'artworks'),
      where('genre', '==', genreFilter),
      orderBy('createdAt', 'desc')
    )
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchArtwork(id) {
  const snap = await getDoc(doc(db, 'artworks', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function saveArtworkGuide(artworkId, guide) {
  await updateDoc(doc(db, 'artworks', artworkId), { guide })
}

// ── Exhibitions ───────────────────────────
export async function fetchExhibitions(filter = null) {
  if (USE_MOCK_DATA) {
    return MOCK_EXHIBITIONS
  }
  let q = query(collection(db, 'exhibitions'), orderBy('startDate', 'asc'))
  if (filter === 'ongoing') {
    const now = new Date()
    q = query(
      collection(db, 'exhibitions'),
      where('endDate', '>=', now),
      orderBy('endDate', 'asc')
    )
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchExhibition(id) {
  const snap = await getDoc(doc(db, 'exhibitions', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ── Users / Artists ───────────────────────
export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function fetchArtworksByArtist(artistId) {
  const q = query(
    collection(db, 'artworks'),
    where('artistId', '==', artistId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchExhibitionsByArtist(artistId) {
  const q = query(
    collection(db, 'exhibitions'),
    where('artistId', '==', artistId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// fetchArtworkById の修正
export async function fetchArtworkById(id) {
  if (USE_MOCK_DATA) {
    return MOCK_ARTWORKS.find((artwork) => artwork.id === id) || null
  }
  const snap = await getDoc(doc(db, 'artworks', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ── Upload (Cloudinary) ──────────────────
export async function createArtwork(data, imageFile) {
  let imageUrl = ''
  if (imageFile) {
    const formData = new FormData()
    formData.append('file', imageFile, 'artwork.jpg')
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    imageUrl = response.data.secure_url
  }
  const docRef = await addDoc(collection(db, 'artworks'), {
    ...data,
    imageUrl,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function createExhibition(data, coverFile) {
  let coverUrl = ''
  if (coverFile) {
    const formData = new FormData()
    formData.append('file', coverFile, 'cover.jpg')
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    coverUrl = response.data.secure_url
  }
  const docRef = await addDoc(collection(db, 'exhibitions'), {
    ...data,
    coverUrl,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}
