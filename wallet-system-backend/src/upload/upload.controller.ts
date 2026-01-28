import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('presigned-url')
  async getPresignedUrl(
    @Req() req: any,
    @Query('contentType') contentType: string,
  ) {
    if (!contentType) {
      // Default to jpeg if not provided, or throw error.
      // For now, let's allow it to default in the service or ensure frontend sends it.
      contentType = 'image/jpeg';
    }

    // Basic validation for content type to ensure only images
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    return this.uploadService.getPresignedUploadUrl(req.user.id, contentType);
  }
}
