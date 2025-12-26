export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface CreateAchievementRequest {
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface UpdateAchievementRequest extends Partial<CreateAchievementRequest> {
  id: string;
}