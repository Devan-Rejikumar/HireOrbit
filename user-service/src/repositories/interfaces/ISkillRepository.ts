import { Skill } from '@prisma/client';

export interface ISkillRepository {
  create(name: string, category?: string): Promise<Skill>;
  findAll(includeInactive?: boolean): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
  findByName(name: string): Promise<Skill | null>;
  update(id: string, data: { name?: string; category?: string; isActive?: boolean }): Promise<Skill>;
  delete(id: string): Promise<void>;
}


