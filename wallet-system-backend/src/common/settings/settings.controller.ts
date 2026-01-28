import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public/:key')
  async getPublicSetting(@Param('key') key: string) {
    const setting = await this.settingsService.getPublic(key);
    return setting;
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Put(':key')
  async updateSetting(@Param('key') key: string, @Body() value: any) {
    await this.settingsService.set(key, value);
    return { success: true };
  }
}
