import { inject, injectable } from "inversify";
import { PrismaClient, Application, ApplicationStatusHistory, ApplicationNotes, ApplicationStatus } from "@prisma/client";
import { IApplicationRepository } from "../interfaces/IApplicationRepository";
import { CreateApplicationInput, UpdateApplicationStatusInput, AddApplicationNoteInput } from "../../dto/schemas/application.schema";
import { TYPES } from '../../config/types';
import { logger } from '../../utils/logger';

@injectable()
export class ApplicationRepository implements IApplicationRepository {
  constructor(@inject(TYPES.PrismaClient) private _prisma: PrismaClient) { }
  async create(data: CreateApplicationInput): Promise<Application> {
    return await this._prisma.application.create({
      data: {
        ...data,
        status: 'PENDING' as ApplicationStatus,
        appliedAt: new Date(),
      }
    })

  }
  async findById(id: string): Promise<Application | null> {
    return await this._prisma.application.findUnique({
      where: { id }
    })
  }

  async findByUserId(userId: string): Promise<Array<Application & {
    jobTitle?: string;
    companyName?: string;
  }>> {
    const applications = await this._prisma.application.findMany({
      where: { userId },
      orderBy: { appliedAt: 'desc' }
    });

 
    return applications.map(app => ({
      ...app,
      jobTitle: undefined,
      companyName: undefined
    }));
  }

  async findByUserIdPaginated(userId: string, page: number, limit: number, status?: string): Promise<{
    applications: Array<Application & {jobTitle?: string;companyName?: string;}>;
    total: number;
  }> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      this._prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: 'desc' }
      }),
      this._prisma.application.count({ where })
    ]);

    return {
      applications: applications.map(app => ({
        ...app,
        jobTitle: undefined,
        companyName: undefined
      })),
      total
    };
  }

  async findByCompanyId(companyId: string): Promise<Application[]> {
    let applications = await this._prisma.application.findMany({
      where: { companyId },
      orderBy: { appliedAt: 'desc' }
    });

    
    return applications;
  }

  async findByJobId(jobId: string): Promise<Application[]> {
    return await this._prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: 'desc' }
    })
  }

  async update(id: string, data: Partial<Application>): Promise<Application> {
    return this._prisma.application.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this._prisma.application.delete({
      where: { id }
    })
  }


  async updateStatus(id: string, data: UpdateApplicationStatusInput, changedBy: string): Promise<Application> {
    return await this._prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: { id },
        data: {
          status: data.status as ApplicationStatus,
          updatedAt: new Date(),
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          status: data.status as ApplicationStatus,
          changedBy,
          reason: data.reason,
          changedAt: new Date(),
        },
      });

      return updatedApplication;
    });
  }

  async getStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]> {
    return await this._prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { changedAt: 'desc' },
    });
  }


  async addNote(applicationId: string, data: AddApplicationNoteInput): Promise<ApplicationNotes> {
    return await this._prisma.applicationNotes.create({
      data: {
        applicationId,
        note: data.note,
        addedBy: data.addedBy,
        addedAt: new Date(),
      },
    });
  }

  async getNotes(applicationId: string): Promise<ApplicationNotes[]> {
    return await this._prisma.applicationNotes.findMany({
      where: { applicationId },
      orderBy: { addedAt: 'desc' },
    });
  }

  async deleteNote(noteId: string): Promise<void> {
    await this._prisma.applicationNotes.delete({
      where: { id: noteId },
    });
  }


  async findWithRelations(id: string): Promise<(Application & {
    statusHistory: ApplicationStatusHistory[];
    notes: ApplicationNotes[];
  }) | null> {
    return await this._prisma.application.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        notes: {
          orderBy: { addedAt: 'desc' },
        },
      },
    });
  }

  async findByUserIdWithRelations(userId: string): Promise<Array<Application & {
    statusHistory: ApplicationStatusHistory[];
    notes: ApplicationNotes[];
  }>> {
    return await this._prisma.application.findMany({
      where: { userId },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        notes: {
          orderBy: { addedAt: 'desc' },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findByCompanyIdWithRelations(companyId: string): Promise<Array<Application & {
    statusHistory: ApplicationStatusHistory[];
    notes: ApplicationNotes[];
  }>> {
    return await this._prisma.application.findMany({
      where: { companyId },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        notes: {
          orderBy: { addedAt: 'desc' },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findByStatus(status: string, companyId?: string): Promise<Application[]> {
    return await this._prisma.application.findMany({
      where: {
        status: status as ApplicationStatus,
        ...(companyId && { companyId }),
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, companyId?: string): Promise<Application[]> {
    return await this._prisma.application.findMany({
      where: {
        appliedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(companyId && { companyId }),
      },
      orderBy: { appliedAt: 'desc' },
    });
  }


  async getApplicationStats(companyId: string): Promise<{total: number;pending: number;reviewing: number;shortlisted: number;rejected: number;accepted: number;withdrawn: number;}> {
    const applications = await this._prisma.application.findMany({
      where: { companyId },
      select: { status: true },
    });

    const stats = {
      total: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      accepted: 0,
      withdrawn: 0,
    };

    applications.forEach(app => {
      switch (app.status) {
        case 'PENDING':
          stats.pending++;
          break;
        case 'REVIEWING':
          stats.reviewing++;
          break;
        case 'SHORTLISTED':
          stats.shortlisted++;
          break;
        case 'REJECTED':
          stats.rejected++;
          break;
        case 'ACCEPTED':
          stats.accepted++;
          break;
        case 'WITHDRAWN':
          stats.withdrawn++;
          break;
      }
    });

    return stats;
  }


  async findPaginated(page: number,limit: number,filters?: {companyId?: string;userId?: string;status?: string;jobId?: string;}): Promise<{
    applications: Application[];
    total: number;
  }> {
    const where = {
      ...(filters?.companyId && { companyId: filters.companyId }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.status && { status: filters.status as ApplicationStatus }),
      ...(filters?.jobId && { jobId: filters.jobId }),
    };

    const [applications, total] = await Promise.all([
      this._prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      this._prisma.application.count({ where }),
    ]);

    return { applications, total };
  }


  async checkDuplicateApplication(userId: string, jobId: string): Promise<Application | null> {
    return await this._prisma.application.findFirst({
      where: {
        userId,
        jobId,
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });
  }


  async bulkUpdateStatus(applicationIds: string[], status: string, changedBy: string): Promise<void> {
    await this._prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: {
          id: {
            in: applicationIds,
          },
        },
        data: {
          status: status as ApplicationStatus,
          updatedAt: new Date(),
        },
      });

      const statusHistoryData = applicationIds.map(applicationId => ({
        applicationId,
        status: status as ApplicationStatus,
        changedBy,
        changedAt: new Date(),
      }));

      await tx.applicationStatusHistory.createMany({
        data: statusHistoryData,
      });
    });
  }

  async getTopApplicantsByApplicationCount(limit: number): Promise<Array<{ userId: string; applicationCount: number }>> {
    const applications = await this._prisma.application.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    return applications.map(app => ({
      userId: app.userId,
      applicationCount: app._count.id
    }));
  }

  async getTopJobsByApplicationCount(limit: number): Promise<Array<{ jobId: string; applicationCount: number }>> {
    const applications = await this._prisma.application.groupBy({
      by: ['jobId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    return applications.map(app => ({
      jobId: app.jobId,
      applicationCount: app._count.id
    }));
  }

}