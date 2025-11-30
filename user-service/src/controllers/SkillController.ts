import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../config/types';
import { ISkillService } from '../services/interfaces/ISkillService';
import { CreateSkillSchema, UpdateSkillSchema } from '../dto/schemas/skill.schema';
import { buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class SkillController {
  constructor(
    @inject(TYPES.ISkillService)
    private readonly _skillService: ISkillService,
  ) {}

  // Public endpoint: list active skills for users (autocomplete)
  async getActiveSkills(req: Request, res: Response): Promise<void> {
    const skills = await this._skillService.getActiveSkills();
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ skills }, 'Skills retrieved successfully'),
    );
  }

  // Admin endpoints
  async createSkill(req: Request, res: Response): Promise<void> {
    const validationResult = CreateSkillSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const skill = await this._skillService.createSkill(validationResult.data);
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ skill }, 'Skill created successfully'),
    );
  }

  async getAllSkills(req: Request, res: Response): Promise<void> {
    const includeInactive = req.query.includeInactive === 'true';
    const skills = await this._skillService.getAllSkills(includeInactive);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ skills }, 'Skills retrieved successfully'),
    );
  }

  async updateSkill(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Skill ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const validationResult = UpdateSkillSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const skill = await this._skillService.updateSkill(id, validationResult.data);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ skill }, 'Skill updated successfully'),
    );
  }

  async deleteSkill(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Skill ID is required', HttpStatusCode.BAD_REQUEST);
    }

    await this._skillService.deleteSkill(id);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, 'Skill deleted successfully'),
    );
  }
}


