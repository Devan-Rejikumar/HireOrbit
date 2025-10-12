import { User } from '@prisma/client';

export interface IAdminRepository {
    findByEmail(email:string):Promise<User|null>;
}