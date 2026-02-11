import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import { join } from 'path';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import type { IdMappings } from './model.types';

const MODEL_DIR = join(process.cwd(), 'models', 'recommendation');
const MODEL_PATH = `file://${MODEL_DIR}/model.json`;
const MAPPINGS_PATH = join(MODEL_DIR, 'id-mappings.json');

@Injectable()
export class ModelLoaderService {
  private readonly logger = new Logger(ModelLoaderService.name);
  private model: tf.LayersModel | null = null;

  get isLoaded(): boolean {
    return this.model !== null;
  }

  getModel(): tf.LayersModel | null {
    return this.model;
  }

  async loadModel(): Promise<boolean> {
    const modelJsonPath = join(MODEL_DIR, 'model.json');
    if (!existsSync(modelJsonPath)) {
      this.logger.warn(
        `No saved model found at ${modelJsonPath}. Model must be trained first.`
      );
      return false;
    }

    try {
      this.model = await tf.loadLayersModel(MODEL_PATH);
      this.logger.log('Recommendation model loaded from disk');
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to load model from disk',
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  async saveModel(model: tf.LayersModel): Promise<void> {
    try {
      await model.save(`file://${MODEL_DIR}`);
      this.model = model;
      this.logger.log(`Model saved to ${MODEL_DIR}`);
    } catch (error) {
      this.logger.error(
        'Failed to save model',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  saveMappings(mappings: IdMappings): void {
    try {
      mkdirSync(MODEL_DIR, { recursive: true });

      const serializable = {
        userIdToIndex: Array.from(mappings.userIdToIndex.entries()),
        indexToUserId: Array.from(mappings.indexToUserId.entries()),
        productIdToIndex: Array.from(mappings.productIdToIndex.entries()),
        indexToProductId: Array.from(mappings.indexToProductId.entries()),
      };

      writeFileSync(MAPPINGS_PATH, JSON.stringify(serializable));
      this.logger.log('ID mappings saved to disk');
    } catch (error) {
      this.logger.error(
        'Failed to save ID mappings',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  loadMappings(): IdMappings | null {
    if (!existsSync(MAPPINGS_PATH)) {
      this.logger.warn('No saved ID mappings found on disk');
      return null;
    }

    try {
      const raw = JSON.parse(readFileSync(MAPPINGS_PATH, 'utf-8'));

      const mappings: IdMappings = {
        userIdToIndex: new Map<string, number>(raw.userIdToIndex),
        indexToUserId: new Map<number, string>(raw.indexToUserId),
        productIdToIndex: new Map<string, number>(raw.productIdToIndex),
        indexToProductId: new Map<number, string>(raw.indexToProductId),
      };

      this.logger.log(
        `ID mappings loaded: ${mappings.userIdToIndex.size} users, ${mappings.productIdToIndex.size} products`
      );
      return mappings;
    } catch (error) {
      this.logger.error(
        'Failed to load ID mappings from disk',
        error instanceof Error ? error.stack : undefined
      );
      return null;
    }
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.logger.log('Model disposed');
    }
  }
}
