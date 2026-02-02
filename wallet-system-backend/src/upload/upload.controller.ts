import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res,
  UnauthorizedException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import type { Response as ExpressResponse } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Basic validation
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    return this.uploadService.uploadFile(file, req.user.id);
  }



  @Public()
  @Get('view')
  async viewFile(
    @Query('key') key: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() res: ExpressResponse,
  ) {
    if (!key || !expires || !signature) {
      throw new BadRequestException('Invalid access parameters');
    }

    const isValid = this.uploadService.verifyUrlSignature(key, parseInt(expires, 10), signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired link');
    }

    const { buffer, mimeType } = await this.uploadService.getFileBuffer(key);

    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*', // Allow cross-origin image loading
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });

    res.send(buffer);
  }
}