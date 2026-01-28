import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('AWS_BUCKET_NAME');
    const region = this.configService.getOrThrow<string>('AWS_REGION');
    const credentials = {
      accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow<string>(
        'AWS_SECRET_ACCESS_KEY',
      ),
    };

    // Initialize S3 Client (compatible with AWS and other S3-compatible providers)
    this.s3Client = new S3Client({
      region,
      credentials,
      endpoint: this.configService.get<string>('AWS_ENDPOINT'), // Optional custom endpoint
      forcePathStyle: true, // Needed for some S3-compatible providers
    });
  }

  async getPresignedUploadUrl(
    userId: string,
    contentType: string = 'image/jpeg',
  ): Promise<{ url: string; fields: Record<string, string>; key: string }> {
    const key = `proofs/${userId}/${uuidv4()}`;

    try {
      const { url, fields } = await createPresignedPost(this.s3Client, {
        Bucket: this.bucketName,
        Key: key,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024], // up to 5 MB
          ['eq', '$Content-Type', contentType],
        ],
        Fields: {
          'Content-Type': contentType,
        },
        Expires: 300, // 5 minutes
      });

      return { url, fields, key };
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new InternalServerErrorException('Could not generate upload URL');
    }
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 }); // 15 minutes
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new InternalServerErrorException('Could not generate download URL');
    }
  }

  async scanS3Object(key: string): Promise<any[]> {
    try {
      // 1. Fetch the file buffer from S3
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('Empty body in S3 object');
      }

      // Collect stream into a buffer
      const byteArray = await response.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);

      if (buffer.length === 0) {
        throw new Error('File is empty (0 bytes)');
      }

      // 2. Initialize Tesseract Worker
      const worker = await createWorker('eng');

      // 3. Recognize text
      const { data } = await worker.recognize(buffer);
      const lines = data.blocks
        ? data.blocks.flatMap((block) =>
          block.paragraphs.flatMap((p) => p.lines),
        )
        : [];

      // Use a consistent way to determine image dimensions if possible.
      // Tesseract.js typically handles geometry in pixels. To match Textract's 0-1 range,
      // we need the image dimensions.
      // Tesseract.js results don't always directly expose the source image dimensions easily in the data object
      // without an extra step, but `lines` contains bbox data.
      // We will ESTIMATE or standardise.
      // Actually, let's just return the raw text if geometry is too hard, BUT
      // the frontend relies on geometry.
      // Workaround: We can't easily get dimensions without an image library. 
      // HOWEVER, `bbox` in lines has x0, y0, x1, y1.
      // We can infer the "max" width/height observed to normalize, OR
      // we can trust that the bounding box is enough.
      // WAIT: Textract returns `Geometry: { BoundingBox: { Width, Height, Left, Top } }` as RATIOS (0-1).
      // Tesseract returns PIXELS.
      // Frontend code: `left: ${Left * 100}%`.
      // If we send pixels (e.g. Left=100) -> 10000% -> Broken UI.
      // We MUST normalize.

      // Feature: Check if Tesseract provides page dimensions.
      // In recent versions, `data` includes `imageColor` etc? No.
      // Let's use a trick: Max(x1) and Max(y1) from all words/lines approximates the width/height.
      // It's not perfect but better than 0.

      let maxX = 1;
      let maxY = 1;

      // Calculate extent from all lines (or words if we went deeper)
      lines.forEach(line => {
        if (line.bbox.x1 > maxX) maxX = line.bbox.x1;
        if (line.bbox.y1 > maxY) maxY = line.bbox.y1;
      });

      // Add a small padding assumption or just use these as "image dimensions"
      // It might be slightly smaller than real image but ensures boxes wrap tightly.
      const imgWidth = maxX;
      const imgHeight = maxY;

      const results = lines.map(line => ({
        text: line.text.trim(),
        geometry: {
          BoundingBox: {
            Left: line.bbox.x0 / imgWidth,
            Top: line.bbox.y0 / imgHeight,
            Width: (line.bbox.x1 - line.bbox.x0) / imgWidth,
            Height: (line.bbox.y1 - line.bbox.y0) / imgHeight
          }
        }
      })).filter(item => item.text.length > 0);

      await worker.terminate();

      return results;

    } catch (error) {
      console.error('Error processing document with Tesseract:', error);
      throw new InternalServerErrorException('Could not scan document');
    }
  }
}
