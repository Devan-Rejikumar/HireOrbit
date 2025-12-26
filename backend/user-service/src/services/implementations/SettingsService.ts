import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { ISettingsService } from '../interfaces/ISettingsService';
import { ISettingsRepository } from '../../repositories/interfaces/ISettingsRepository';

@injectable()
export class SettingsService implements ISettingsService {
  constructor(
    @inject(TYPES.ISettingsRepository) private _settingsRepository: ISettingsRepository
  ) {}

  async getSettings() {
    return await this._settingsRepository.getSettings();
  }

  async updateLogo(logoUrl: string) {
    return await this._settingsRepository.updateSettings({ logoUrl });
  }

  async updateCompanyName(companyName: string) {
    return await this._settingsRepository.updateSettings({ companyName });
  }

  async updateAboutPage(aboutPage: string) {
    return await this._settingsRepository.updateSettings({ aboutPage });
  }

  async updateSettings(data: {
    logoUrl?: string | null;
    companyName?: string | null;
    aboutPage?: string | null;
  }) {
    return await this._settingsRepository.updateSettings(data);
  }
}

