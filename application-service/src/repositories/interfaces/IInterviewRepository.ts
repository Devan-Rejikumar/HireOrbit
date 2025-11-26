import { Interview, Application } from "@prisma/client";

export type InterviewWithApplication = Interview & {
    application: Application;
};

export interface IInterviewRepository {
    create(data: {applicationId: string;
        scheduledAt: Date;
        duration: number;
        type: string;
        location?: string;
        meetingLink?: string;
        notes?: string;
    }): Promise<Interview>;
    findById(id: string): Promise<Interview | null>;
    findByApplicationId(applicationId: string): Promise<Interview[]>;
    findByCompanyId(companyId: string): Promise<InterviewWithApplication[]>;
    update(id:string,data:Partial<Interview>): Promise<Interview>;
    updateStatus(id:string,status:string):Promise<Interview>;
    delete(id:string):Promise<void>;
}