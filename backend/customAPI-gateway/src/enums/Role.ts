/**
 * User roles in the system
 */
export enum Role {
    JOBSEEKER = 'jobseeker',
    COMPANY = 'company',
    ADMIN = 'admin'
  }
  
  /**
   * Type guard to check if a string is a valid role
   */
  export const isValidRole = (role: string): role is Role => {
    return Object.values(Role).includes(role as Role);
  };