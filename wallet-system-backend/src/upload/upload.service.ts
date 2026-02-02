import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ClientStr from 'ssh2-sftp-client';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import sharp from 'sharp';

// Fix for import issues depending on tsconfig
const Client = ClientStr as unknown as typeof ClientStr;

@Injectable()
export class UploadService {
  private config: any;
  private uploadPath: string;
  private appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.getOrThrow<string>('SFTP_UPLOAD_PATH');
    this.appUrl = this.configService.getOrThrow<string>('APP_URL');
    this.config = {
      host: this.configService.getOrThrow<string>('SFTP_HOST'),
      port: parseInt(this.configService.getOrThrow<string>('SFTP_PORT'), 10),
      username: this.configService.getOrThrow<string>('SFTP_USER'),
      password: this.configService.getOrThrow<string>('SFTP_PASS'),
      algorithms: {
        serverHostKey: ['ssh-rsa', 'ssh-dss'],
        cipher: ['aes256-cbc', 'aes128-cbc', '3des-cbc'],
        hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1'],
        compress: ['none'],
      },
    };
  }

  private async getSftpClient(): Promise<ClientStr> {
    const sftp = new ClientStr();
    await sftp.connect(this.config);
    return sftp;
  }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<{ key: string; url: string }> {
    let sftp: ClientStr | null = null;
    try {
      sftp = await this.getSftpClient();
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      // Organize by user ID to avoid massive directories
      const remoteDir = `${this.uploadPath}/proofs/${userId}`;
      const remotePath = `${remoteDir}/${filename}`;
      const key = `proofs/${userId}/${filename}`; // Key stored in DB

      // Ensure directory exists
      const dirExists = await sftp.exists(remoteDir);
      if (!dirExists) {
        await sftp.mkdir(remoteDir, true);
      }

      await sftp.put(file.buffer, remotePath);
      return { key, url: await this.generateSignedAccessUrl(key) };
    } catch (error) {
      console.error('SFTP Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload file to storage');
    } finally {
      if (sftp) await sftp.end();
    }
  }

  // Generates a URL that points to OUR backend (Verify Controller)
  async generateSignedAccessUrl(key: string): Promise<string> {
    const expires = Date.now() + 60 * 60 * 1000; // 60 mins
    const signature = this.signUrl(key, expires);
    // Encode components to ensure safety
    return `${this.appUrl}/api/v1/upload/view?key=${encodeURIComponent(key)}&expires=${expires}&signature=${signature}`;
  }

  async getFileBuffer(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    let sftp: ClientStr | null = null;
    try {
      sftp = await this.getSftpClient();
      const remotePath = `${this.uploadPath}/${key}`;

      const exists = await sftp.exists(remotePath);
      if (!exists) {
        throw new NotFoundException('File not found');
      }

      const buffer = await sftp.get(remotePath);
      if (!Buffer.isBuffer(buffer)) {
        throw new InternalServerErrorException('Failed to retrieve file buffer');
      }

      // Simple mime type deduction or default
      const ext = path.extname(key).toLowerCase();
      // Basic support for common image types
      let mimeType = 'application/octet-stream';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.pdf') mimeType = 'application/pdf';

      return { buffer, mimeType };
    } catch (error) {
      console.error('SFTP Get Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve file');
    } finally {
      if (sftp) await sftp.end();
    }
  }

  verifyUrlSignature(key: string, expires: number, signature: string): boolean {
    const expected = this.signUrl(key, expires);
    if (Date.now() > expires) return false;
    return signature === expected;
  }

  private signUrl(key: string, expires: number): string {
    // secure secret handling
    const secret = this.configService.get<string>('JWT_SECRET', 'fallback-secret');
    return crypto
      .createHmac('sha256', secret)
      .update(`${key}:${expires}`)
      .digest('hex');
  }

  async scanStoredObject(key: string): Promise<any[]> {
    let sftp: ClientStr | null = null;
    try {
      sftp = await this.getSftpClient();
      const remotePath = `${this.uploadPath}/${key}`;

      const buffer = await sftp.get(remotePath);
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error('File is empty or invalid');
      }

      // Preprocess image with Sharp for high-quality OCR
      const tmpPath = path.join(os.tmpdir(), `ocr_${uuidv4()}.png`);
      try {
        const processed = await sharp(buffer)
          .rotate() // Respect EXIF orientation
          .resize(1200, null, { // Scale to 1200px width for better OCR quality
            withoutEnlargement: false,
            fastShrinkOnLoad: false
          })
          .png()
          .toFile(tmpPath);

        const imgWidth = processed.width;
        const imgHeight = processed.height;

        // Initialize Tesseract Worker
        const worker = await createWorker('eng');
        const { data } = await worker.recognize(tmpPath);

        await worker.terminate();

        // Cleanup temp file
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }

        // Try to extract structured lines with geometry
        let lines: any[] = [];
        if (data.blocks && data.blocks.length > 0) {
          lines = data.blocks.flatMap((block: any) =>
            block.paragraphs?.flatMap((p: any) => p.lines || []) || []
          );
        }

        // If no structured data, fall back to splitting raw text
        if (lines.length === 0 && data.text && data.text.trim().length > 0) {
          const rawLines = data.text.split('\n').filter((l: string) => l.trim().length > 0);
          return rawLines.map((text: string) => ({
            text: text.trim(),
            geometry: null // No bounding boxes available from raw text
          }));
        }

        const results = lines.map((line: any) => ({
          text: line.text.trim(),
          geometry: line.bbox ? {
            BoundingBox: {
              Left: line.bbox.x0 / imgWidth,
              Top: line.bbox.y0 / imgHeight,
              Width: (line.bbox.x1 - line.bbox.x0) / imgWidth,
              Height: (line.bbox.y1 - line.bbox.y0) / imgHeight
            }
          } : null
        })).filter((item: any) => item.text.length > 0);

        return results;

      } catch (ocrProcessingError) {
        // Cleanup on failure
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
        console.error('OCR Pipeline Failed:', ocrProcessingError);
        throw new InternalServerErrorException('Failed to extract text from document');
      }

    } catch (error) {
      console.error('Error processing document from SFTP:', error);
      throw new InternalServerErrorException('Could not scan document');
    } finally {
      if (sftp) await sftp.end();
    }
  }
}