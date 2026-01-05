import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';

interface UserData {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  avatar?: string;
}

interface ProfileData {
  id: string;
  userId: string;
  profilePicture?: string | null;
  headline?: string | null;
  location?: string | null;
}

interface UserApiResponse {
  success: boolean;
  data: {
    user: UserData;
    profile?: ProfileData;
  };
}

interface ProfileApiResponse {
  success: boolean;
  data: {
    profile: ProfileData;
  };
}

/**
 * Hook to fetch and cache user profile data including profile picture
 * Fetches both user data and profile data to get the complete profile picture
 * Prevents duplicate requests when multiple components need the same user's data
 */
export const useUserProfile = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserData | null> => {
      if (!userId) return null;
      
      try {
        // First, fetch user data
        const userResponse = await api.get<UserApiResponse>(`/users/${userId}`);
        const userData = userResponse.data?.data?.user;
        
        if (!userData) return null;
        
        // Get profile picture from the response (backend now includes it)
        // Response structure: { success: true, data: { user: {...}, profile: { profilePicture: "..." } } }
        const profileData = userResponse.data?.data?.profile;
        const profilePicture = profileData?.profilePicture || null;
        
        // Return user data with profile picture if available
        const finalProfilePicture = profilePicture || userData.profilePicture || userData.avatar || undefined;
        
        const result = {
          ...userData,
          profilePicture: finalProfilePicture,
        };
        
        return result;
      } catch (error) {
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 0, // Temporarily set to 0 to always fetch fresh data (for debugging)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch to get latest data (for debugging)
    retry: 2,
  });
};

