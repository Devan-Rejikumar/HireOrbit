export interface IResumeRepository {
    saveResume(userId:string, resumeUrl:string):Promise<void>;
    getResume(userId:string):Promise<string | null>;
    deleteResume(userId:string):Promise<void>;
}