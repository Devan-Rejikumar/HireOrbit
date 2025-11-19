/**
 * Centralized message constants for User Service
 * All success and error messages used across controllers
 */
export const Messages = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    REGISTRATION_SUCCESS: 'User registered successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    ADMIN_LOGOUT_SUCCESS: 'Admin logged out successfully',
    TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
    ADMIN_TOKEN_REFRESH_SUCCESS: 'Admin token refreshed successfully',
    USER_NOT_AUTHENTICATED: 'User not authenticated',
    ADMIN_NOT_AUTHENTICATED: 'Admin not authenticated',
    ADMIN_AUTH_REQUIRED: 'Admin authentication required',
    NO_REFRESH_TOKEN: 'No refresh token provided',
    ADMIN_REFRESH_TOKEN_REQUIRED: 'Admin refresh token is required',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    INVALID_ADMIN_REFRESH_TOKEN: 'Invalid admin refresh token',
    ACCOUNT_BLOCKED: 'Account blocked',
    INVALID_CREDENTIALS: 'Invalid credentials',
    INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
    LOGIN_FAILED: 'Login failed',
    LOGOUT_FAILED: 'Logout failed',
    ADMIN_LOGOUT_FAILED: 'Admin logout failed',
    INVALID_TOKEN: 'Invalid token',
    AUTHENTICATION_FAILED: 'Authentication failed',
    AUTHENTICATION_REQUIRED: 'Authentication required',
    GOOGLE_LOGIN_SUCCESS: 'Google login successful',
    GOOGLE_REGISTRATION_SUCCESS: 'Google user registered successfully',
    GOOGLE_AUTH_FAILED: 'Google authentication failed',
  },


  USER: {
    NOT_FOUND: 'User not found',
    RETRIEVED_SUCCESS: 'User retrieved successfully',
    PROFILE_RETRIEVED_SUCCESS: 'User profile retrieved successfully',
    ID_REQUIRED: 'User ID is required',
    ALREADY_BLOCKED: 'User already blocked',
    NOT_BLOCKED: 'User not blocked',
    BLOCKED_SUCCESS: 'User blocked successfully',
    UNBLOCKED_SUCCESS: 'User unblocked successfully',
    FETCH_FAILED: 'Failed to fetch users',
  },


  PROFILE: {
    CREATED_SUCCESS: 'Profile created successfully',
    RETRIEVED_SUCCESS: 'Profile retrieved successfully',
    UPDATED_SUCCESS: 'Profile updated successfully',
    NOT_FOUND: 'Profile not found',
    ALREADY_EXISTS: 'Profile already exists',
    NAME_UPDATE_FAILED: 'Name update failed',
    FAILED_UPDATE_NAME: 'Failed to update user name',
    CURRENT_PROFILE_FETCHED_SUCCESS: 'Current profile fetched successfully',
    DELETED_SUCCESS: 'Profile deleted successfully',
    CREATE_REQUIRED: 'Profile not found. Please create a profile first.',
    IMAGE_UPLOAD_FAILED: 'Failed to upload image to Cloudinary',
    IMAGE_UPLOAD_ERROR: 'Image upload failed',
  },

  EXPERIENCE: {
    ADDED_SUCCESS: 'Experience added successfully',
    UPDATED_SUCCESS: 'Experience updated successfully',
    DELETED_SUCCESS: 'Experience deleted successfully',
    NOT_FOUND: 'Experience not found',
    ID_REQUIRED: 'Experience ID is required',
    UPDATE_UNAUTHORIZED: 'You can only update your own experience',
    DELETE_UNAUTHORIZED: 'You can only delete your own experience',
  },

  EDUCATION: {
    ADDED_SUCCESS: 'Education added successfully',
    UPDATED_SUCCESS: 'Education updated successfully',
    DELETED_SUCCESS: 'Education deleted successfully',
    NOT_FOUND: 'Education not found',
    ID_REQUIRED: 'Education ID is required',
    UPDATE_UNAUTHORIZED: 'You can only update your own education',
    DELETE_UNAUTHORIZED: 'You can only delete your own education',
  },


  OTP: {
    GENERATED_SUCCESS: 'OTP generated successfully',
    SENT_SUCCESS: 'OTP sent successfully',
    VERIFIED_SUCCESS: 'OTP verified successfully',
    RESENT_SUCCESS: 'OTP resent successfully',
    GENERATION_FAILED: 'OTP generation failed',
    VERIFICATION_FAILED: 'OTP verification failed',
    RESEND_FAILED: 'OTP resend failed',
    EXPIRED: 'OTP has expired',
    INVALID: 'Invalid OTP',
    INVALID_OR_EXPIRED: 'Invalid or expired OTP',
  },


  VALIDATION: {
    FAILED: 'Validation failed',
    EMAIL_AND_PASSWORD_REQUIRED: 'Email and password are required',
    EMAIL_ALREADY_REGISTERED: 'Email already registered',
    EMAIL_ALREADY_IN_USE: 'Email already in use',
  },


  COMPANY: {
    NOT_FOUND: 'Company not found',
    ALREADY_APPROVED: 'Company already approved',
    ALREADY_PROCESSED: 'Company already processed',
    PROFILE_NOT_COMPLETED: 'Company profile not completed',
    APPROVED_SUCCESS: 'Company approved successfully',
    REJECTED_SUCCESS: 'Company rejected successfully',
    ID_REQUIRED: 'Company ID is required',
    REJECTION_REASON_REQUIRED: 'Rejection reason is required',
    REJECTION_REASON_MIN_LENGTH: 'Rejection reason must be at least 10 characters long',
  },

  ACHIEVEMENT: {
    ADDED_SUCCESS: 'Achievement added successfully',
    RETRIEVED_SUCCESS: 'Achievement retrieved successfully',
    RETRIEVED_ALL_SUCCESS: 'Achievements retrieved successfully',
    UPDATED_SUCCESS: 'Achievement updated successfully',
    DELETED_SUCCESS: 'Achievement deleted successfully',
    NOT_FOUND: 'Achievement not found',
    ID_REQUIRED: 'Achievement ID is required',
    ADD_FAILED: 'Failed to add achievement',
    GET_FAILED: 'Failed to get achievement',
    GET_ALL_FAILED: 'Failed to get achievements',
    UPDATE_FAILED: 'Failed to update achievement',
    DELETE_FAILED: 'Failed to delete achievement',
  },

  CERTIFICATION: {
    ADDED_SUCCESS: 'Certification added successfully',
    RETRIEVED_SUCCESS: 'Certification retrieved successfully',
    RETRIEVED_ALL_SUCCESS: 'Certifications retrieved successfully',
    UPDATED_SUCCESS: 'Certification updated successfully',
    DELETED_SUCCESS: 'Certification deleted successfully',
    NOT_FOUND: 'Certification not found',
    ID_REQUIRED: 'Certification ID is required',
    ADD_FAILED: 'Failed to add certification',
    GET_FAILED: 'Failed to get certification',
    GET_ALL_FAILED: 'Failed to get certifications',
    UPDATE_FAILED: 'Failed to update certification',
    DELETE_FAILED: 'Failed to delete certification',
  },

  RESUME: {
    UPLOADED_SUCCESS: 'Resume uploaded successfully',
    RETRIEVED_SUCCESS: 'Resume retrieved successfully',
    DELETED_SUCCESS: 'Resume deleted successfully',
    NOT_FOUND: 'Resume not found',
    NO_DATA_PROVIDED: 'No resume data provided',
    FILE_REQUIRED: 'Resume file required',
    INVALID_FORMAT: 'Invalid resume data format',
    FORMAT_REQUIRED: 'Resume must be base64 data URI',
    UPLOAD_FAILED: 'Failed to upload resume',
    GET_FAILED: 'Failed to get resume',
    DELETE_FAILED: 'Failed to delete resume',
  },

  PASSWORD_RESET: {
    OTP_SENT_SUCCESS: 'Password reset OTP sent successfully',
    RESET_SUCCESS: 'Password reset successful',
    RESET_FAILED: 'Password reset failed',
    CHANGE_SUCCESS: 'Password changed successfully. Please login again.',
    CHANGE_FAILED: 'Password change failed',
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  },

  NAME: {
    UPDATE_SUCCESS: 'Name updated successfully',
  },


  ERROR: {
    UNKNOWN: 'Unknown error',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    INVALID_REQUEST: 'Invalid request',
    SOMETHING_WENT_WRONG: 'Something went wrong',
    FAILED_TO_RETRIEVE_USER: 'Failed to retrieve user',
    UNAUTHORIZED: 'UNAUTHORIZED',
    BAD_REQUEST: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
    INVALID_JSON_FORMAT: 'Invalid JSON format',
    JSON_PARSE_ERROR: 'JSON parse error',
    INVALID_JSON_BODY: 'Invalid JSON in request body',
    REQUEST_BODY_MUST_BE_JSON: 'Request body must be valid JSON',
  },
} as const;