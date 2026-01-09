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
import { PaginatedResult } from '../../repositories/interfaces/ISkillRepository';

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
      if (!existing.isActive) {
        return this._skillRepository.update(existing.id, {
          isActive: true,
          category: data.category,
        });
      }
     
      throw new AppError('This skill already exists', HttpStatusCode.BAD_REQUEST);
    }

    return this._skillRepository.create(name, data.category);
  }

  async getAllSkills(includeInactive: boolean = false): Promise<Skill[]> {
    return this._skillRepository.findAll(includeInactive);
  }

  async getSkillsPaginated(includeInactive: boolean, page: number, limit: number): Promise<PaginatedResult<Skill>> {
    return this._skillRepository.findPaginated(includeInactive, page, limit);
  }

  async getActiveSkills(): Promise<Skill[]> {
    return this._skillRepository.findAll(false);
  }

  async getSkillById(id: string): Promise<Skill | null> {
    return this._skillRepository.findById(id);
  }

  async updateSkill(id: string, data: SkillUpdateInput): Promise<Skill> {
    if(data.name){
      const name = data.name.trim();
      const existing = await this._skillRepository.findByName(name);
      if(existing && existing.id !== id){
        throw new AppError('A skill with this name already exist', HttpStatusCode.BAD_REQUEST);
      }
    }
    return this._skillRepository.update(id, data);
  }

  async deleteSkill(id: string): Promise<void> {
    await this._skillRepository.delete(id);
  }
}


