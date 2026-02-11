import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import { ModelLoaderService } from './model.loader';
import type {
  TrainingData,
  IdMappings,
  RecommendationResult,
} from './model.types';

const EMBEDDING_DIM = 32;

@Injectable()
export class ModelService implements OnModuleInit {
  private readonly logger = new Logger(ModelService.name);
  private idMappings: IdMappings | null = null;

  constructor(private readonly modelLoader: ModelLoaderService) {}

  async onModuleInit() {
    const loaded = await this.modelLoader.loadModel();
    if (loaded) {
      const mappings = this.modelLoader.loadMappings();
      if (mappings) {
        this.idMappings = mappings;
        this.logger.log('Recommendation model and ID mappings ready for inference');
      } else {
        this.logger.warn('Model loaded but ID mappings missing. Retraining required.');
      }
    } else {
      this.logger.warn(
        'No pre-trained model found. Call train endpoint to create one.'
      );
    }
  }

  /**
   * Build a two-tower embedding model for collaborative filtering.
   * User embedding dot Product embedding = predicted rating.
   */
  buildModel(numUsers: number, numProducts: number): tf.LayersModel {
    const userInput = tf.input({ shape: [1], name: 'user_input' });
    const productInput = tf.input({ shape: [1], name: 'product_input' });

    const userEmbedding = tf.layers
      .embedding({
        inputDim: numUsers,
        outputDim: EMBEDDING_DIM,
        name: 'user_embedding',
      })
      .apply(userInput) as tf.SymbolicTensor;

    const productEmbedding = tf.layers
      .embedding({
        inputDim: numProducts,
        outputDim: EMBEDDING_DIM,
        name: 'product_embedding',
      })
      .apply(productInput) as tf.SymbolicTensor;

    const userFlat = tf.layers
      .flatten({ name: 'user_flatten' })
      .apply(userEmbedding) as tf.SymbolicTensor;

    const productFlat = tf.layers
      .flatten({ name: 'product_flatten' })
      .apply(productEmbedding) as tf.SymbolicTensor;

    const dotProduct = tf.layers
      .dot({ axes: -1, name: 'dot_product' })
      .apply([userFlat, productFlat]) as tf.SymbolicTensor;

    const model = tf.model({
      inputs: [userInput, productInput],
      outputs: dotProduct,
      name: 'recommendation_model',
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });

    this.logger.log(
      `Model built: ${numUsers} users, ${numProducts} products, ${EMBEDDING_DIM}d embeddings`
    );

    return model;
  }

  /**
   * Train the model on interaction data.
   */
  async train(data: TrainingData, mappings: IdMappings): Promise<void> {
    const { userIndices, productIndices, ratings, numUsers, numProducts } =
      data;

    const model = this.buildModel(numUsers, numProducts);

    const userTensor = tf.tensor2d(
      userIndices.map((i) => [i]),
      [userIndices.length, 1]
    );
    const productTensor = tf.tensor2d(
      productIndices.map((i) => [i]),
      [productIndices.length, 1]
    );
    const ratingTensor = tf.tensor1d(ratings);

    this.logger.log(
      `Training on ${userIndices.length} interactions...`
    );

    await model.fit([userTensor, productTensor], ratingTensor, {
      epochs: 20,
      batchSize: 64,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 5 === 0) {
            this.logger.log(
              `Epoch ${epoch}: loss=${logs?.['loss']?.toFixed(4)}, val_loss=${logs?.['val_loss']?.toFixed(4)}`
            );
          }
        },
      },
    });

    // Clean up tensors
    userTensor.dispose();
    productTensor.dispose();
    ratingTensor.dispose();

    // Save model and mappings to disk
    await this.modelLoader.saveModel(model);
    this.modelLoader.saveMappings(mappings);
    this.idMappings = mappings;

    this.logger.log('Training complete. Model and mappings saved.');
  }

  /**
   * Predict top-N product recommendations for a given user.
   */
  predict(userId: string, topN = 10): RecommendationResult[] {
    const model = this.modelLoader.getModel();
    if (!model || !this.idMappings) {
      this.logger.warn('Model not trained yet. Returning empty recommendations.');
      return [];
    }

    const userIndex = this.idMappings.userIdToIndex.get(userId);
    if (userIndex === undefined) {
      this.logger.debug(`Unknown user ${userId}, no personalized recommendations`);
      return [];
    }

    const numProducts = this.idMappings.productIdToIndex.size;
    const userArray = Array(numProducts).fill(userIndex);
    const productArray = Array.from({ length: numProducts }, (_, i) => i);

    const userTensor = tf.tensor2d(
      userArray.map((i) => [i]),
      [numProducts, 1]
    );
    const productTensor = tf.tensor2d(
      productArray.map((i) => [i]),
      [numProducts, 1]
    );

    const predictions = model.predict([
      userTensor,
      productTensor,
    ]) as tf.Tensor;
    const scores = predictions.dataSync() as Float32Array;

    // Clean up
    userTensor.dispose();
    productTensor.dispose();
    predictions.dispose();

    // Build scored results and sort
    const results: RecommendationResult[] = [];
    for (let i = 0; i < numProducts; i++) {
      const productId = this.idMappings.indexToProductId.get(i);
      if (productId) {
        results.push({ productId, score: scores[i] });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topN);
  }

  setIdMappings(mappings: IdMappings): void {
    this.idMappings = mappings;
  }

  getIdMappings(): IdMappings | null {
    return this.idMappings;
  }
}
