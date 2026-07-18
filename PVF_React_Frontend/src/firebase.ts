import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type User } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBkxV72Jefo-ZN9HXTTAApzWPiAuB-fn7w',
  authDomain: 'prime-focus-services.firebaseapp.com',
  projectId: 'prime-focus-services',
  storageBucket: 'prime-focus-services.firebasestorage.app',
  messagingSenderId: '939430515884',
  appId: '1:939430515884:web:372f7c363f4af4be55bb09',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export type UserRole = 'basic-user' | 'admin' | 'doctor'
export const DEFAULT_ROLE: UserRole = 'basic-user'

export async function createUserProfile(user: User, role?: UserRole) {
  const userRef = doc(db, 'users', user.uid)
  const existingDoc = await getDoc(userRef)
  const existingRole = existingDoc.data()?.role as UserRole | undefined

  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email ?? '',
      role: role ?? existingRole ?? DEFAULT_ROLE,
      createdAt: existingDoc.exists() ? existingDoc.data()?.createdAt : serverTimestamp(),
    },
    { merge: true },
  )
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('Firebase is not configured yet. Check the Firebase config values.')
}
