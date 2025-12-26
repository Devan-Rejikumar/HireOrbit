import { UserApiResponse } from '../../types/external-api.types';

export interface IUserServiceClient {
  getUserById(userId: string): Promise<UserApiResponse>;
}

