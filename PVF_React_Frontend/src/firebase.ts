import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type User } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: '',
  authDomain: 'prime-vision-focus-abe.firebaseapp.com',
  projectId: 'prime-vision-focus-abe',
  storageBucket: 'prime-vision-focus-abe.firebasestorage.app',
  messagingSenderId: '1092941670344',
  appId: '1:1092941670344:web:731a0827b94d330203c2fd',
  measurementId: 'G-WEC0WKMHQQ',
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
  console.warn('Firebase is not configured yet. Add your Vite env values before testing auth.')
}
