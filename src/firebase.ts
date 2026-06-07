// Firebase configuration for Storenest customer authentication.
// Email/Password sign-in is enabled in the Firebase console for this project.
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth'

export const firebaseConfig = {
  apiKey: 'AIzaSyCwunFhzHPak1xt-UpAevLr2ynaKeVeERE',
  authDomain: 'storenest-3ffb3.firebaseapp.com',
  projectId: 'storenest-3ffb3',
  storageBucket: 'storenest-3ffb3.firebasestorage.app',
  messagingSenderId: '316714184995',
  appId: '1:316714184995:web:a8d40533f811d36d349c96',
}

let app: FirebaseApp
let auth: Auth

export function getFirebaseAuth(): Auth {
  if (!auth) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  }
  return auth
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
}
