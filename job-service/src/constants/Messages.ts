/**
 * Centralized message constants for Job Service
 * All success and error messages used across controllers
 */
export const Messages = {
  JOB: {
    CREATED_SUCCESS: 'Job created successfully',
    CREATED_FAILED: 'Job creation failed',
    UPDATED_SUCCESS: 'Job updated successfully',
    UPDATE_FAILED: 'Job update failed',
    DELETED_SUCCESS: 'Job deleted successfully',
    DELETION_FAILED: 'Job deletion failed',
    RETRIEVED_SUCCESS: 'Jobs retrieved successfully',
    RETRIEVE_FAILED: 'Failed to retrieve jobs',
    NOT_FOUND: 'Job not found',
    ID_REQUIRED: 'Job ID is required',
    SEARCHED_SUCCESS: 'Jobs searched successfully',
    SEARCH_FAILED: 'Job search failed',
    SUGGESTIONS_RETRIEVED_SUCCESS: 'Job suggestions retrieved successfully',
    SUGGESTIONS_RETRIEVE_FAILED: 'Failed to get job suggestions',
    COUNT_RETRIEVED_SUCCESS: 'Job count retrieved successfully',
    COUNT_RETRIEVE_FAILED: 'Failed to get job count',
    DUPLICATE_TITLE: 'Job with this title already exists for this company',
  },

  VALIDATION: {
    VALIDATION_FAILED: 'Validation failed',
    MISSING_JOB_ID: 'Missing job ID parameter',
    MISSING_COMPANY_ID: 'Missing company ID parameter',
    COMPANY_ID_REQUIRED: 'Company ID is required',
    AUTHENTICATION_REQUIRED: 'User must be authenticated to create jobs',
  },

  ERROR: {
    SOMETHING_WENT_WRONG: 'Something went wrong',
  },
} as const;

