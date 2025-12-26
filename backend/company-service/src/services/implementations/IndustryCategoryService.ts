import { inject, injectable } from 'inversify';
import { IndustryCategory } from '@prisma/client';
import TYPES from '../../config/types';
import { IIndustryCategoryRepository } from '../../repositories/interfaces/IIndustryCategoryRepository';
import {
  IIndustryCategoryService,
  IndustryCategoryInput,
  IndustryCategoryUpdateInput,
} from '../interfaces/IIndustryCategoryService';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';

@injectable()
export class IndustryCategoryService implements IIndustryCategoryService {
  constructor(
    @inject(TYPES.IIndustryCategoryRepository)
    private readonly _industryCategoryRepository: IIndustryCategoryRepository,
  ) {}

  async createCategory(data: IndustryCategoryInput): Promise<IndustryCategory> {
    const name = data.name.trim();
    const existing = await this._industryCategoryRepository.findByName(name);

    if (existing) {
      // If category exists but is inactive, just reactivate it
      if (!existing.isActive) {
        return this._industryCategoryRepository.update(existing.id, {
          isActive: true,
        });
      }
      // If it's already active, show clear error message
      throw new AppError('This industry category already exists', HttpStatusCode.BAD_REQUEST);
    }

    return this._industryCategoryRepository.create(name);
  }

  async getAllCategories(includeInactive: boolean = false): Promise<IndustryCategory[]> {
    return this._industryCategoryRepository.findAll(includeInactive);
  }

  async getActiveCategories(): Promise<IndustryCategory[]> {
    return this._industryCategoryRepository.findAll(false);
  }

  async getCategoryById(id: string): Promise<IndustryCategory | null> {
    return this._industryCategoryRepository.findById(id);
  }

  async updateCategory(id: string, data: IndustryCategoryUpdateInput): Promise<IndustryCategory> {
    return this._industryCategoryRepository.update(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this._industryCategoryRepository.delete(id);
  }
}

