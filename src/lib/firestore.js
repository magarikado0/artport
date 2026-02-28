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
import { Cloudinary } from '@cloudinary/url-gen'
import axios from 'axios'
import { db } from './firebase'

// Cloudinary の設定
const cld = new Cloudinary({ cloud: { cloudName: 'dtanz2zfw' } })
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dtanz2zfw/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'database' // Cloudinary のアップロードプリセット名

// Cloudinary の画像処理関数
function optimizeImage(imageUrl, width = 500, height = 500) {
  // Cloudinary の public_id を抽出
  const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0]; // URL から public_id を取得
  const img = cld.image(publicId)
  return img
    .resize(auto().width(width).height(height)) // 自動リサイズ
    .format('auto') // 自動フォーマット
    .quality('auto') // 自動品質
    .toURL()
}

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
  return snap.docs.map((d) => {
    const data = d.data()
    if (data.imageUrl) {
      data.imageUrl = optimizeImage(data.imageUrl) // Cloudinary の画像処理を適用
    }
    return { id: d.id, ...data }
  })
}

export async function fetchArtwork(id) {
  const snap = await getDoc(doc(db, 'artworks', id))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.imageUrl) {
    data.imageUrl = optimizeImage(data.imageUrl) // Cloudinary の画像処理を適用
  }
  return { id: snap.id, ...data }
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
  try {
    const snap = await getDocs(q)
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    console.log('Fetched exhibitions:', data) // デバッグ用ログ
    return data
  } catch (error) {
    console.error('Error fetching exhibitions:', error) // エラーをログに出力
    throw error
  }
}

export async function fetchExhibition(id) {
  const snap = await getDoc(doc(db, 'exhibitions', id))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.coverUrl) {
    data.coverUrl = optimizeImage(data.coverUrl) // Cloudinary の画像処理を適用
  }
  return { id: snap.id, ...data }
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
  return snap.docs.map((d) => {
    const data = d.data()
    if (data.imageUrl) {
      data.imageUrl = optimizeImage(data.imageUrl) // Cloudinary の画像処理を適用
    }
    return { id: d.id, ...data }
  })
}

export async function fetchExhibitionsByArtist(artistId) {
  const q = query(
    collection(db, 'exhibitions'),
    where('artistId', '==', artistId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    if (data.coverUrl) {
      data.coverUrl = optimizeImage(data.coverUrl) // Cloudinary の画像処理を適用
    }
    return { id: d.id, ...data }
  })
}

export async function fetchArtworkById(id) {
  try {
    console.log('Fetching artwork with ID:', id); // デバッグ用ログ
    const snap = await getDoc(doc(db, 'artworks', id));
    if (!snap.exists()) {
      console.warn(`Artwork with ID ${id} not found`);
      return null; // ドキュメントが存在しない場合は null を返す
    }
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error fetching artwork:', error);
    throw error;
  }
}

export async function createArtwork(data, imageFile) {
  let imageUrl = '';
  if (imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      imageUrl = response.data.secure_url; // Cloudinary から返される画像 URL
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  }

  try {
    const docRef = await addDoc(collection(db, 'artworks'), {
      ...data,
      imageUrl,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating artwork in Firestore:', error);
    throw error;
  }
}

export async function createExhibition(data, coverFile) {
  let coverUrl = '';
  if (coverFile) {
    const formData = new FormData();
    formData.append('file', coverFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      coverUrl = response.data.secure_url; // Cloudinary から返される画像 URL
    } catch (error) {
      console.error('Error uploading cover image to Cloudinary:', error);
      throw error;
    }
  }

  try {
    const docRef = await addDoc(collection(db, 'exhibitions'), {
      ...data,
      coverUrl,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating exhibition in Firestore:', error);
    throw error;
  }
}
