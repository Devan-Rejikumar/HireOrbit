import { Application, ApplicationStatusHistory, ApplicationNotes, ApplicationStatus } from '@prisma/client';
import { CreateApplicationInput, UpdateApplicationStatusInput, AddApplicationNoteInput } from '../dto/schemas/application.schema';

export interface IApplicationRepository {
  create(data: CreateApplicationInput): Promise<Application>;
  findById(id: string): Promise<Application | null>;
  findByUserId(userId: string): Promise<Array<Application & {jobTitle?: string;companyName?: string;}>>;
  findByCompanyId(companyId: string): Promise<Application[]>;
  findByJobId(jobId: string): Promise<Application[]>;
  update(id: string, data: Partial<Application>): Promise<Application>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, data: UpdateApplicationStatusInput, changedBy: string): Promise<Application>;
  getStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]>;
  addNote(applicationId: string, data: AddApplicationNoteInput): Promise<ApplicationNotes>;
  getNotes(applicationId: string): Promise<ApplicationNotes[]>;
  deleteNote(noteId: string): Promise<void>;
  findWithRelations(id: string): Promise<(Application & {statusHistory: ApplicationStatusHistory[];notes: ApplicationNotes[];}) | null>;
  findByUserIdWithRelations(userId: string): Promise<Array<Application & {statusHistory: ApplicationStatusHistory[];notes: ApplicationNotes[];}>>;
  findByCompanyIdWithRelations(companyId: string): Promise<Array<Application & {statusHistory: ApplicationStatusHistory[];notes: ApplicationNotes[];}>>;
  findByStatus(status: ApplicationStatus, companyId?: string): Promise<Application[]>;
  findByDateRange(startDate: Date, endDate: Date, companyId?: string): Promise<Application[]>;
  getApplicationStats(companyId: string): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    shortlisted: number;
    rejected: number;
    accepted: number;
    withdrawn: number;
  }>;
  findPaginated(
    page: number,
    limit: number,
    filters?: {
      companyId?: string;
      userId?: string;
      status?: ApplicationStatus;
      jobId?: string;
    }
  ): Promise<{
    applications: Application[];
    total: number;
  }>;
  checkDuplicateApplication(userId: string, jobId: string): Promise<Application | null>;
  bulkUpdateStatus(applicationIds: string[], status: ApplicationStatus, changedBy: string): Promise<void>;
}