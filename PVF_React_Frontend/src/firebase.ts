import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type User } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
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
  console.warn('Firebase is not configured yet. Add VITE_FIREBASE_* values to your .env file.')
}
