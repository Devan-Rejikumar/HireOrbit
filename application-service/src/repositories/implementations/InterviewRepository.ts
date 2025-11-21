import { injectable } from "inversify";
import { PrismaClient, Interview } from "@prisma/client";
import { IInterviewRepository, InterviewWithApplication } from "../interface/IInterviewRepository";


@injectable()
export class InterviewRepository implements IInterviewRepository {
    private _prisma: PrismaClient;
    constructor() {
        this._prisma = new PrismaClient();
    }

    async create(data: { applicationId: string; scheduledAt: Date; duration: number; type: string; location?: string; meetingLink?: string; notes?: string; }): Promise<Interview> {
        return await this._prisma.interview.create({
            data: {
                ...data,
                status: 'PENDING'
            }
        });
    }

    async findById(id: string): Promise<Interview | null> {
        return await this._prisma.interview.findUnique({
            where:{id}
        });
    }

    async findByApplicationId(applicationId: string): Promise<Interview[]> {
        return await this._prisma.interview.findMany({
            where:{applicationId},
            orderBy:{scheduledAt:'asc'}
        });
    }

    async findByCompanyId(companyId: string): Promise<InterviewWithApplication[]> {
        return await this._prisma.interview.findMany({
            where:{application:{companyId}},include:{application:true},orderBy:{scheduledAt:'asc'}
        })
    }

    async update(id: string, data: Partial<Interview>): Promise<Interview> {
        return await this._prisma.interview.update({
            where:{id},
            data
        });
    }

    async updateStatus(id: string, status: string): Promise<Interview> {
        return await this._prisma.interview.update({
            where:{id},
            data:{status}
        })
    }
    async delete(id: string): Promise<void> {
        await this._prisma.interview.delete({where:{id}})
    }
}