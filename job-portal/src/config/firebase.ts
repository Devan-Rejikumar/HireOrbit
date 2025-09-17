import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBr4fx1mGnQr5vzvz1TEJcZLbtCHpWg4_I',
  authDomain: 'hireorbit-d4744.firebaseapp.com',
  projectId: 'hireorbit-d4744',
  storageBucket: 'hireorbit-d4744.firebasestorage.app',
  messagingSenderId: '1037206792006',
  appId: '1:1037206792006:web:55c4b0d1e0a676fa28a747',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google provider for better popup support
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
