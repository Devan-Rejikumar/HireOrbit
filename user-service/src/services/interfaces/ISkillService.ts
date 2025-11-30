import { Skill } from '@prisma/client';

export interface SkillInput {
  name: string;
  category?: string;
}

export interface SkillUpdateInput {
  name?: string;
  category?: string;
  isActive?: boolean;
}

export interface ISkillService {
  createSkill(data: SkillInput): Promise<Skill>;
  getAllSkills(includeInactive?: boolean): Promise<Skill[]>;
  getActiveSkills(): Promise<Skill[]>;
  getSkillById(id: string): Promise<Skill | null>;
  updateSkill(id: string, data: SkillUpdateInput): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
}


