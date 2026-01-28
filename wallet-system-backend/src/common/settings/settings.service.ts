import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';

export interface ReferralLevelConfig {
  level: number;
  percentage: number;
}

export interface ReferralSettings {
  levels: ReferralLevelConfig[];
}

export interface FinancialSettings {
  withdrawalFee: number;
  minWithdrawal: number;
  minRecharge: number;
  principalTax: number;
}

export const SETTINGS_KEYS = {
  REFERRAL: 'REFERRAL_SETTINGS',
  FINANCIAL: 'FINANCIAL_SETTINGS',
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) { }

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    const defaults = [
      {
        key: SETTINGS_KEYS.REFERRAL,
        value: { levels: [] },
        description: 'Multi-level referral reward configuration',
        isPublic: false,
      },
      {
        key: SETTINGS_KEYS.FINANCIAL,
        value: {
          withdrawalFee: 4, 
          minWithdrawal: 100,
          minRecharge: 500,
          principalTax: 5,
        },
        description: 'Global financial settings (Fees, Limits, Taxes)',
        isPublic: true,
      },
    ];

    for (const def of defaults) {
      const exists = await this.repo.findOne({ where: { key: def.key } });
      if (!exists) {
        this.logger.log(`Seeding default setting: ${def.key}`);
        await this.repo.save(this.repo.create(def));
      }
    }
  }

  async get<T>(key: string): Promise<T> {
    const setting = await this.repo.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found`);
    }
    return setting.value as T;
  }

  async getPublic<T>(key: string): Promise<T> {
    const setting = await this.repo.findOne({ where: { key, isPublic: true } });
    if (!setting) {
      // Throw NotFound even if it exists but is private, to avoid leaking existence
      throw new NotFoundException(`Public setting ${key} not found`);
    }
    return setting.value as T;
  }

  async set(key: string, value: any): Promise<void> {
    let setting = await this.repo.findOne({ where: { key } });
    if (!setting) {
      setting = this.repo.create({ key, value });
    } else {
      setting.value = value;
    }
    await this.repo.save(setting);
    this.logger.log(`Updated setting: ${key}`);
  }

  // Typed Helpers
  async getReferralSettings(): Promise<ReferralSettings> {
    return this.get<ReferralSettings>(SETTINGS_KEYS.REFERRAL);
  }

  async getFinancialSettings(): Promise<FinancialSettings> {
    return this.get<FinancialSettings>(SETTINGS_KEYS.FINANCIAL);
  }
}
