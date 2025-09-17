export interface IJob{
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    salary?: string;
    jobType: string;
    requirements: string;
    benefits: string[];
    isActive:boolean;
    createdAt: Date;
    updateAt:Date;
}

export interface IJobApplication{
    id: string;
    userId: string;
    jobId:string;
    status:string;
    appliedAt:Date;
}

export interface JobSearchFilters{
    title?:string;
    company?:string;
    location?:string;
    jobType?:string;
    salaryMin?:number;
    salaryMax?:number;
}