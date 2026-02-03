#!/bin/bash

# Kafka Topics Initialization Script
# This script creates all necessary Kafka topics for the TecShop microservices

set -e

KAFKA_CONTAINER="${KAFKA_CONTAINER:-tec-shop-kafka}"
KAFKA_BROKER="${KAFKA_BROKER:-localhost:9092}"

echo "================================================"
echo "TecShop Kafka Topics Initialization"
echo "================================================"
echo "Kafka Container: $KAFKA_CONTAINER"
echo "Kafka Broker: $KAFKA_BROKER"
echo ""

echo "Checking if Kafka container is running..."
if ! docker ps --format '{{.Names}}' | grep -q "^${KAFKA_CONTAINER}$"; then
  echo "Error: Kafka container '$KAFKA_CONTAINER' is not running"
  echo "Please start Kafka first:"
  echo "  docker-compose -f docker-compose.kafka.yml up -d"
  exit 1
fi

echo "Kafka container is running!"
echo ""

# Function to run kafka commands inside the container
kafka_cmd() {
  docker exec "$KAFKA_CONTAINER" "$@"
}

echo "Checking Kafka availability..."
if ! kafka_cmd kafka-broker-api-versions --bootstrap-server "$KAFKA_BROKER" > /dev/null 2>&1; then
  echo "Error: Cannot connect to Kafka broker at $KAFKA_BROKER"
  echo "Kafka container may still be starting up. Please wait a moment and try again."
  exit 1
fi

echo "Kafka broker is available!"
echo ""

# Topic: chat.new_message
echo "[1/2] Creating topic: chat.new_message"
kafka_cmd kafka-topics --create --if-not-exists \
  --bootstrap-server "$KAFKA_BROKER" \
  --topic chat.new_message \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config segment.ms=86400000 \
  --config cleanup.policy=delete 2>/dev/null || true

echo "  Partitions: 3"
echo "  Replication Factor: 1"
echo "  Retention: 7 days (604800000 ms)"
echo "  Used by: chatting-service (ChatGateway -> ChatMessageConsumer)"
echo ""

# Topic: users-event
echo "[2/2] Creating topic: users-event"
kafka_cmd kafka-topics --create --if-not-exists \
  --bootstrap-server "$KAFKA_BROKER" \
  --topic users-event \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config segment.ms=86400000 \
  --config cleanup.policy=delete 2>/dev/null || true

echo "  Partitions: 3"
echo "  Replication Factor: 1"
echo "  Retention: 30 days (2592000000 ms)"
echo "  Used by: api-gateway, order-service -> kafka-service"
echo ""

echo "================================================"
echo "Topics created successfully!"
echo "================================================"
echo ""

echo "Listing all topics:"
kafka_cmd kafka-topics --list --bootstrap-server "$KAFKA_BROKER"
echo ""

echo "Topic descriptions:"
kafka_cmd kafka-topics --describe --bootstrap-server "$KAFKA_BROKER" --topic chat.new_message
echo ""
kafka_cmd kafka-topics --describe --bootstrap-server "$KAFKA_BROKER" --topic users-event
echo ""

echo "================================================"
echo "Kafka UI: http://localhost:8090"
echo "================================================"
