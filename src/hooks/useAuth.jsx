import { useState, useEffect, createContext, useContext } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Firestoreからプロフィール取得
        const docRef = doc(db, 'users', firebaseUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserProfile(docSnap.data())
        } else {
          // 初回ログイン: ユーザーを作成
          const newProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'ゲスト' : ''),
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || '',
            role: 'viewer',
            bio: '',
            genre: '',
            isAnonymous: firebaseUser.isAnonymous || false,
            onboardingDone: false,
            createdAt: new Date(),
          }
          await setDoc(docRef, newProfile)
          setUserProfile(newProfile)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  
  const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password)
  
  const signupWithEmail = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // Firestoreにプロフィール作成
    const newProfile = {
      uid: userCredential.user.uid,
      name: name || '',
      email: userCredential.user.email || '',
      avatarUrl: '',
      role: 'viewer',
      bio: '',
      genre: '',
      onboardingDone: false,
      createdAt: new Date(),
    }
    await setDoc(doc(db, 'users', userCredential.user.uid), newProfile)
    return userCredential
  }
  
  const loginAnonymously = () => signInAnonymously(auth)

  const logout = () => signOut(auth)

  const updateUserProfile = async (fields) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), fields)
    setUserProfile(prev => ({ ...prev, ...fields }))
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, loginWithGoogle, loginWithEmail, signupWithEmail, loginAnonymously, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
