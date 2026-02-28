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
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'
import { db, storage } from './firebase'

// ── Artworks ──────────────────────────────
export async function fetchArtworks(genreFilter = null) {
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

export async function createArtwork(data, imageFile) {
  let imageUrl = ''
  if (imageFile) {
    const storageRef = ref(storage, `artworks/${Date.now()}_${imageFile.name}`)
    await uploadBytes(storageRef, imageFile)
    imageUrl = await getDownloadURL(storageRef)
  }
  const docRef = await addDoc(collection(db, 'artworks'), {
    ...data,
    imageUrl,
    guide: '',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function saveArtworkGuide(artworkId, guide) {
  await updateDoc(doc(db, 'artworks', artworkId), { guide })
}

// ── Exhibitions ───────────────────────────
export async function fetchExhibitions(filter = null) {
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

export async function createExhibition(data, coverFile) {
  let coverUrl = ''
  if (coverFile) {
    const storageRef = ref(storage, `exhibitions/${Date.now()}_${coverFile.name}`)
    await uploadBytes(storageRef, coverFile)
    coverUrl = await getDownloadURL(storageRef)
  }
  const docRef = await addDoc(collection(db, 'exhibitions'), {
    ...data,
    coverUrl,
    createdAt: serverTimestamp(),
  })
  return docRef.id
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
