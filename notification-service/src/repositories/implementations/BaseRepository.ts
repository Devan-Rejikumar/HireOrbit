import { Document, Model } from 'mongoose';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = new this.model(entity);
    return await newEntity.save();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  async findAll(): Promise<T[]> {
    return await this.model.find();
  }

  async update(id: string, entity: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, entity, { new: true });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async count(): Promise<number> {
    return await this.model.countDocuments();
  }
}