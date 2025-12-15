import { IndustryCategory } from '@prisma/client';

export interface IIndustryCategoryRepository {
  create(name: string): Promise<IndustryCategory>;
  findAll(includeInactive?: boolean): Promise<IndustryCategory[]>;
  findById(id: string): Promise<IndustryCategory | null>;
  findByName(name: string): Promise<IndustryCategory | null>;
  update(id: string, data: { name?: string; isActive?: boolean }): Promise<IndustryCategory>;
  delete(id: string): Promise<void>;
}

