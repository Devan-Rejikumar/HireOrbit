import { signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
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

  // Check for redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          await processGoogleUser(result.user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  const processGoogleUser = async (user: any) => {
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
      
      // Try popup first, fallback to redirect
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return await processGoogleUser(result.user);
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('Cross-Origin-Opener-Policy')) {
          // Fallback to redirect
          await signInWithRedirect(auth, googleProvider);
          // The redirect will handle the rest
          return Promise.reject(new Error('Redirecting...'));
        }
        throw popupError;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
};
