import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function migrateStorageUrls() {
  const artworksRef = collection(db, 'artworks');
  const artworksSnap = await getDocs(artworksRef);

  for (const docSnap of artworksSnap.docs) {
    const data = docSnap.data();
    if (data.imageUrl && data.imageUrl.includes('firebasestorage.googleapis.com')) {
      // Cloudinary の URL に置き換える（例: プレースホルダー）
      const newImageUrl = data.imageUrl.replace(
        'firebasestorage.googleapis.com',
        'res.cloudinary.com/dtanz2zfw'
      );
      await updateDoc(doc(db, 'artworks', docSnap.id), { imageUrl: newImageUrl });
      console.log(`Updated imageUrl for artwork ID: ${docSnap.id}`);
    }
  }
}

migrateStorageUrls().catch(console.error);
