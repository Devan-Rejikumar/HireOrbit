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
  

    ERROR: {
      UNKNOWN: 'Unknown error',
      INTERNAL_SERVER_ERROR: 'Internal server error',
      INVALID_REQUEST: 'Invalid request',
      SOMETHING_WENT_WRONG: 'Something went wrong',
      FAILED_TO_RETRIEVE_USER: 'Failed to retrieve user',
    },
  } as const;