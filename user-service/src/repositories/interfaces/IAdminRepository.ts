import { User } from '@prisma/client';
import { TimeSeriesDataPoint } from '../../types/admin';

export interface IAdminRepository {
    findByEmail(email:string):Promise<User|null>;
    getUserStatisticsByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' | 'year'): Promise<TimeSeriesDataPoint[]>;
    getTotalUserCount(): Promise<number>;
}