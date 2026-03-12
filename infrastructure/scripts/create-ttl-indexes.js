// Run once: node infrastructure/scripts/create-ttl-indexes.js
// Requires LOGGER_SERVICE_DB_URL env var to be set (e.g. via .env or export)
'use strict';

const { MongoClient } = require('mongodb');

async function createTtlIndexes() {
  const url = process.env.LOGGER_SERVICE_DB_URL;
  if (!url) {
    throw new Error('LOGGER_SERVICE_DB_URL environment variable is not set');
  }

  const client = new MongoClient(url);
  await client.connect();

  try {
    const db = client.db();

    // 30-day TTL on LogEntry.timestamp
    await db.collection('LogEntry').createIndex(
      { timestamp: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60, background: true, name: 'timestamp_ttl_idx' },
    );

    console.log('TTL indexes created successfully');
    console.log('  - LogEntry.timestamp: 30-day TTL (expireAfterSeconds=2592000)');
  } finally {
    await client.close();
  }
}

createTtlIndexes().catch((err) => {
  console.error('Failed to create TTL indexes:', err);
  process.exit(1);
});
