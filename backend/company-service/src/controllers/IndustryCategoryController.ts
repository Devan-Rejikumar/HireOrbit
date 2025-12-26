import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../config/types';
import { IIndustryCategoryService } from '../services/interfaces/IIndustryCategoryService';
import { CreateIndustryCategorySchema, UpdateIndustryCategorySchema } from '../dto/schemas/industry-category.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class IndustryCategoryController {
  constructor(
    @inject(TYPES.IIndustryCategoryService)
    private readonly _industryCategoryService: IIndustryCategoryService,
  ) {}

  // Public endpoint: list active categories for company registration
  async getActiveCategories(req: Request, res: Response): Promise<void> {
    const categories = await this._industryCategoryService.getActiveCategories();
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ categories }, 'Industry categories retrieved successfully'),
    );
  }

  // Admin endpoints
  async createCategory(req: Request, res: Response): Promise<void> {
    const validationResult = CreateIndustryCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const category = await this._industryCategoryService.createCategory(validationResult.data);
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ category }, 'Industry category created successfully'),
    );
  }

  async getAllCategories(req: Request, res: Response): Promise<void> {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await this._industryCategoryService.getAllCategories(includeInactive);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ categories }, 'Industry categories retrieved successfully'),
    );
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Industry category ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const validationResult = UpdateIndustryCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const category = await this._industryCategoryService.updateCategory(id, validationResult.data);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ category }, 'Industry category updated successfully'),
    );
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Industry category ID is required', HttpStatusCode.BAD_REQUEST);
    }

    await this._industryCategoryService.deleteCategory(id);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, 'Industry category deleted successfully'),
    );
  }
}

