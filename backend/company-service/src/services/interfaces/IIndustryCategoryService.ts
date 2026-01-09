import { IndustryCategory } from '@prisma/client';

export interface IndustryCategoryInput {
  name: string;
}

export interface IndustryCategoryUpdateInput {
  name?: string;
  isActive?: boolean;
}

export interface IIndustryCategoryService {
  createCategory(data: IndustryCategoryInput): Promise<IndustryCategory>;
  getAllCategories(includeInactive?: boolean): Promise<IndustryCategory[]>;
  getActiveCategories(): Promise<IndustryCategory[]>;
  getCategoryById(id: string): Promise<IndustryCategory | null>;
  updateCategory(id: string, data: IndustryCategoryUpdateInput): Promise<IndustryCategory>;
  deleteCategory(id: string): Promise<void>;
}

