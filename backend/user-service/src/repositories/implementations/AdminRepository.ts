import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { User } from '@prisma/client';
import { IAdminRepository } from '../interfaces/IAdminRepository';
import { UserRole } from '../../enums/UserRole';
import { TimeSeriesDataPoint } from '../../types/admin';

@injectable()
export class AdminRepository implements IAdminRepository{
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, role: UserRole.ADMIN } });
  }

  async getTotalUserCount(): Promise<number> {
    return prisma.user.count({
      where: {
        role: {
          in: [UserRole.JOBSEEKER, UserRole.USER]
        }
      }
    });
  }

  async getUserStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month' | 'year'
  ): Promise<TimeSeriesDataPoint[]> {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.JOBSEEKER, UserRole.USER]
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

 
    const grouped = new Map<string, number>();
    
    users.forEach(user => {
      const date = new Date(user.createdAt);
      let key: string;
      
      if (groupBy === 'day') {

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        key = `${year}-${month}-${day}`; 
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay()); 
        weekStart.setUTCHours(0, 0, 0, 0);
        const year = weekStart.getUTCFullYear();
        const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
        const day = String(weekStart.getUTCDate()).padStart(2, '0');
        key = `${year}-${month}-${day}`;
      } else if (groupBy === 'month') {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        key = `${year}-${month}`;
      } else { 
        const year = date.getUTCFullYear();
        key = `${year}`;
      }
      
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    const allPeriods = new Map<string, number>();
    
   
    if (groupBy === 'year') {
      const startYear = new Date(startDate).getUTCFullYear();
      const endYear = new Date(endDate).getUTCFullYear();
      
      for (let y = startYear; y <= endYear; y++) {
        const key = `${y}`;
        allPeriods.set(key, grouped.get(key) || 0);
      }
    } else if (groupBy === 'month') {
 
      const startYear = new Date(startDate).getUTCFullYear();
      const endYear = new Date(endDate).getUTCFullYear();
  
      for (let y = startYear; y <= endYear; y++) {
        const startMonth = (y === startYear) ? new Date(startDate).getUTCMonth() : 0;
        const endMonth = (y === endYear) ? new Date(endDate).getUTCMonth() : 11;
        
        for (let m = startMonth; m <= endMonth; m++) {
          const key = `${y}-${String(m + 1).padStart(2, '0')}`;
          allPeriods.set(key, grouped.get(key) || 0);
        }
      }
    } else {
 
      const current = new Date(startDate);
      current.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      while (current <= end) {
        let key: string;
        
        if (groupBy === 'day') {
        
          const year = current.getUTCFullYear();
          const month = String(current.getUTCMonth() + 1).padStart(2, '0');
          const day = String(current.getUTCDate()).padStart(2, '0');
          key = `${year}-${month}-${day}`;
          current.setUTCDate(current.getUTCDate() + 1);
        } else if (groupBy === 'week') {
          const weekStart = new Date(current);
          weekStart.setUTCDate(current.getUTCDate() - current.getUTCDay());
          weekStart.setUTCHours(0, 0, 0, 0);
          const year = weekStart.getUTCFullYear();
          const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
          const day = String(weekStart.getUTCDate()).padStart(2, '0');
          key = `${year}-${month}-${day}`;
          current.setUTCDate(current.getUTCDate() + 7);
        } else {
       
          key = '';
        }
        
        if (key) {
          allPeriods.set(key, grouped.get(key) || 0);
        }
      }
    }

   
    const result: TimeSeriesDataPoint[] = Array.from(allPeriods.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }
}