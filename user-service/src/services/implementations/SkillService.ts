import { inject, injectable } from 'inversify';
import { Skill } from '@prisma/client';
import TYPES from '../../config/types';
import { ISkillRepository } from '../../repositories/interfaces/ISkillRepository';
import {
  ISkillService,
  SkillInput,
  SkillUpdateInput,
} from '../interfaces/ISkillService';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';

@injectable()
export class SkillService implements ISkillService {
  constructor(
    @inject(TYPES.ISkillRepository)
    private readonly _skillRepository: ISkillRepository,
  ) {}

  async createSkill(data: SkillInput): Promise<Skill> {
    const name = data.name.trim();
    const existing = await this._skillRepository.findByName(name);

    if (existing) {
      // If skill exists but is inactive, just reactivate & update it
      if (!existing.isActive) {
        return this._skillRepository.update(existing.id, {
          isActive: true,
          category: data.category,
        });
      }
      // If it's already active, show clear error message
      throw new AppError('This skill already exists', HttpStatusCode.BAD_REQUEST);
    }

    return this._skillRepository.create(name, data.category);
  }

  async getAllSkills(includeInactive: boolean = false): Promise<Skill[]> {
    return this._skillRepository.findAll(includeInactive);
  }

  async getActiveSkills(): Promise<Skill[]> {
    return this._skillRepository.findAll(false);
  }

  async getSkillById(id: string): Promise<Skill | null> {
    return this._skillRepository.findById(id);
  }

  async updateSkill(id: string, data: SkillUpdateInput): Promise<Skill> {
    return this._skillRepository.update(id, data);
  }

  async deleteSkill(id: string): Promise<void> {
    await this._skillRepository.delete(id);
  }
}


