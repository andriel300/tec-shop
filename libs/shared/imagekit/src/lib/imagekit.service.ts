import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import ImageKit from '@imagekit/nodejs';

interface ImageKitConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}

interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  filePath: string;
}

@Injectable()
export class ImageKitService {
  private readonly logger = new Logger(ImageKitService.name);
  private readonly imagekit: ImageKit;

  constructor(@Inject('IMAGEKIT_CONFIG') private config: ImageKitConfig) {
    if (!config.publicKey || !config.privateKey || !config.urlEndpoint) {
      throw new Error(
        'ImageKit configuration is incomplete. Please check environment variables.'
      );
    }

    this.imagekit = new ImageKit({
      publicKey: config.publicKey,
      privateKey: config.privateKey,
      urlEndpoint: config.urlEndpoint,
    });

    this.logger.log('ImageKit service initialized successfully');
  }

  /**
   * Upload a file to ImageKit
   * @param file File buffer
   * @param fileName Original filename
   * @param folder Optional folder path (e.g., 'products')
   * @returns Upload result with URL and fileId
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder = 'products'
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const extension = fileName.split('.').pop();
      const nameWithoutExt = fileName.replace(`.${extension}`, '');
      const uniqueFileName = `${nameWithoutExt}-${timestamp}-${randomSuffix}.${extension}`;

      this.logger.debug(
        `Uploading file to ImageKit: ${uniqueFileName} in folder ${folder}`
      );

      const response = await this.imagekit.upload({
        file: file.toString('base64'),
        fileName: uniqueFileName,
        folder: `/${folder}`,
        useUniqueFileName: false, // We already made it unique
      });

      this.logger.log(
        `File uploaded successfully: ${response.url} (ID: ${response.fileId})`
      );

      return {
        url: response.url,
        fileId: response.fileId,
        name: response.name,
        filePath: response.filePath,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to ImageKit: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw new InternalServerErrorException(
        'Failed to upload image. Please try again.'
      );
    }
  }

  /**
   * Upload multiple files to ImageKit
   * @param files Array of file buffers with filenames
   * @param folder Optional folder path
   * @returns Array of upload results
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalname: string }>,
    folder = 'products'
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    if (files.length > 4) {
      throw new BadRequestException('Maximum 4 images allowed');
    }

    this.logger.debug(`Uploading ${files.length} files to ImageKit`);

    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.originalname, folder)
    );

    try {
      const results = await Promise.all(uploadPromises);
      this.logger.log(`Successfully uploaded ${results.length} files`);
      return results;
    } catch (error) {
      this.logger.error('Failed to upload multiple files', error);
      throw new InternalServerErrorException(
        'Failed to upload one or more images'
      );
    }
  }

  /**
   * Delete a file from ImageKit by fileId
   * @param fileId ImageKit file ID
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file from ImageKit: ${fileId}`);
      await this.imagekit.deleteFile(fileId);
      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from ImageKit: ${fileId}`,
        error
      );
      // Don't throw error - deletion failures shouldn't block the main operation
      // But we should log it for monitoring
    }
  }

  /**
   * Delete multiple files from ImageKit
   * @param fileIds Array of ImageKit file IDs
   */
  async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    if (!fileIds || fileIds.length === 0) {
      return;
    }

    this.logger.debug(`Deleting ${fileIds.length} files from ImageKit`);

    const deletePromises = fileIds.map((fileId) => this.deleteFile(fileId));
    await Promise.allSettled(deletePromises); // Use allSettled to continue even if some fail
  }

  /**
   * Get authentication parameters for client-side upload (if needed)
   */
  getAuthenticationParameters(): {
    publicKey: string;
    urlEndpoint: string;
  } {
    return {
      publicKey: this.config.publicKey,
      urlEndpoint: this.config.urlEndpoint,
    };
  }
}
