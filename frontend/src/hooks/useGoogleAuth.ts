import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { useState, useEffect } from 'react';
import api from '@/api/axios';

interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  token: string;
  isNewUser: boolean;
}

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);


  interface FirebaseUser {
    getIdToken: () => Promise<string>;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }

  const processGoogleUser = async (user: FirebaseUser) => {
    const idToken = await user.getIdToken();
    
    const response = await api.post<GoogleAuthResponse>('/users/google-auth', {
      idToken,
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL,
    });
    
    return response.data;
  };

  const signInWithGoogle = async (): Promise<GoogleAuthResponse> => {
    try {
      setLoading(true);
      
      // Only use popup - no redirect fallback to prevent page reloads
      // Note: Cross-Origin-Opener-Policy warnings may appear in console but are harmless
      // They occur when Firebase checks if the popup window is closed - this is a browser security feature
      try {
        console.log('[useGoogleAuth] Attempting popup sign-in...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('[useGoogleAuth] Popup sign-in successful');
        return await processGoogleUser(result.user);
      } catch (popupError: unknown) {
        // Handle actual Firebase auth errors
        const firebaseError = popupError && typeof popupError === 'object' && 'code' in popupError
          ? (popupError as { code?: string; message?: string })
          : null;
        
        if (firebaseError?.code === 'auth/popup-blocked') {
          throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
        } else if (firebaseError?.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in was cancelled. Please try again.');
        } else if (firebaseError?.code === 'auth/cancelled-popup-request') {
          // This happens when multiple popups are opened - not a real error
          throw new Error('Another sign-in attempt is already in progress. Please wait.');
        }
        
        // For other errors, log but don't treat COOP warnings as fatal
        // COOP warnings are browser security notices and don't prevent sign-in from working
        if (firebaseError?.message?.includes('Cross-Origin-Opener-Policy')) {
          console.warn('[useGoogleAuth] COOP warning detected (harmless):', firebaseError.message);
          // If it's just a COOP warning without an error code, the sign-in might have still succeeded
          // But we can't check, so we'll treat it as an error to be safe
          throw new Error('Sign-in may have been affected by browser security settings. Please try again.');
        }
        
        // For other errors, throw them as-is
        console.error('[useGoogleAuth] Popup sign-in failed:', popupError);
        throw popupError;
      }
    } catch (error) {
      console.error('[useGoogleAuth] Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
};
