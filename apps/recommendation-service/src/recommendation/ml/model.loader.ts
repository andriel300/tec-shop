import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import { join } from 'path';
import { existsSync } from 'fs';

const MODEL_DIR = join(process.cwd(), 'models', 'recommendation');
const MODEL_PATH = `file://${MODEL_DIR}/model.json`;

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

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.logger.log('Model disposed');
    }
  }
}
