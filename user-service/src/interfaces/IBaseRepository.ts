export interface PaginationResult <T>{
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}


export interface IBaseRepository<T> {
    findById(id: string): Promise <T | null>
    findAll(): Promise<T[]>;
    create(data: Partial<T>) : Promise<T>;
    update(id: string, data: Partial<T>) : Promise<T>;
    delete(id:string): Promise<T>
    findOne(where: Record<string, unknown>) : Promise<T | null>;
    findMany(where?: Record<string, unknown>) : Promise<T[]>;
    count(where?: Record<string, unknown>) : Promise<number>;
    findWithPagination(
        page?:number,
        limit?:number,
        where?:Record<string, unknown>,
        orderBy?: Record<string, 'asc' | 'dec'>
    ) : Promise<PaginationResult<T>>;
}