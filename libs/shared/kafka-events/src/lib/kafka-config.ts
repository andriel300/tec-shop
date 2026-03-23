import * as fs from 'fs';

export interface KafkaBuiltConfig {
  clientId: string;
  brokers: string[];
  connectionTimeout?: number;
  requestTimeout?: number;
  ssl?: boolean | { rejectUnauthorized: boolean; ca: string; key: string; cert: string };
  sasl?: { mechanism: 'scram-sha-256'; username: string; password: string };
}

/**
 * Builds a KafkaJS config from environment variables.
 *
 * Auth priority (first match wins):
 *  1. Local broker (localhost / 127.0.0.1 / kafka:) — plain, no SSL
 *  2. mTLS via cert files (KAFKA_SSL_CA_PATH + KAFKA_SSL_CERT_PATH + KAFKA_SSL_KEY_PATH) — Aiven
 *  3. SCRAM-SHA-256 via KAFKA_USERNAME + KAFKA_PASSWORD — RedPanda / Confluent
 *  4. Override with KAFKA_SSL=true to force SSL even without credentials
 */
export function buildKafkaConfig(
  clientId: string,
  opts?: { connectionTimeout?: number; requestTimeout?: number }
): KafkaBuiltConfig {
  const broker =
    process.env.KAFKA_BROKER ||
    process.env.REDPANDA_BROKER ||
    'localhost:9092';

  const isLocalBroker =
    broker.startsWith('localhost') ||
    broker.startsWith('127.0.0.1') ||
    broker.startsWith('kafka:');

  const config: KafkaBuiltConfig = {
    clientId,
    brokers: [broker],
    ...opts,
  };

  // mTLS via cert files — checked FIRST so it works for both local and remote brokers
  // Local dev: localhost:9093 + certs/kafka/ (setup-kafka-mtls.sh)
  // Production: Aiven or MSK with mTLS
  const caPath   = process.env.KAFKA_SSL_CA_PATH;
  const certPath = process.env.KAFKA_SSL_CERT_PATH;
  const keyPath  = process.env.KAFKA_SSL_KEY_PATH;

  if (caPath && certPath && keyPath) {
    config.ssl = {
      rejectUnauthorized: true,
      ca:   fs.readFileSync(caPath).toString(),
      cert: fs.readFileSync(certPath).toString(),
      key:  fs.readFileSync(keyPath).toString(),
    };
    return config;
  }

  if (isLocalBroker) {
    return config; // no SSL, no auth
  }

  // SCRAM-SHA-256 (RedPanda, Confluent Cloud, etc.)
  const username = process.env.KAFKA_USERNAME || process.env.REDPANDA_USERNAME;
  const password = process.env.KAFKA_PASSWORD || process.env.REDPANDA_PASSWORD;
  const sslOverride = process.env.KAFKA_SSL;

  const useScram =
    sslOverride === 'true' ||
    (!!(username && password) && sslOverride !== 'false');

  if (useScram && username && password) {
    config.ssl = true;
    config.sasl = { mechanism: 'scram-sha-256', username, password };
    return config;
  }

  // Remote broker with KAFKA_SSL=true but no creds — just TLS
  if (sslOverride === 'true') {
    config.ssl = true;
  }

  return config;
}
