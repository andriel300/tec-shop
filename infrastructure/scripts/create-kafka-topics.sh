#!/usr/bin/env bash
# create-kafka-topics.sh
#
# Creates all required Kafka topics with a partition count that matches the
# maximum kafka-service replica count. This ensures every replica in the
# consumer group gets at least one partition assigned — idle replicas are
# the result of partition count < consumer count.
#
# Usage:
#   ./infrastructure/scripts/create-kafka-topics.sh              # uses KAFKA_BROKER from env or defaults to localhost:9092
#   KAFKA_BROKER=kafka:29092 ./infrastructure/scripts/create-kafka-topics.sh
#   PARTITIONS=5 ./infrastructure/scripts/create-kafka-topics.sh  # override partition count
#
# Prerequisites: kafka-topics.sh on PATH (included in the Kafka binary distribution),
# or run from inside the Kafka container:
#   docker exec tec-shop-kafka ./create-kafka-topics.sh

set -euo pipefail

BROKER="${KAFKA_BROKER:-localhost:9092}"
# Match the max kafka-service replicas in values.prod.yaml (default 8).
# For local dev 2 replicas is fine — set PARTITIONS=2 or leave default.
PARTITIONS="${PARTITIONS:-8}"
REPLICATION_FACTOR="${REPLICATION_FACTOR:-1}"

# All topics from @tec-shop/kafka-events KafkaTopics + DLQ variants
TOPICS=(
  "users-event"
  "users-event.DLQ"
  "log-events"
  "log-events.DLQ"
  "chat.new_message"
  "chat.new_message.DLQ"
  "notification-events"
  "notification-events.DLQ"
  "order-events"
  "order-events.DLQ"
  "seller-events"
  "seller-events.DLQ"
)

echo "[create-kafka-topics] Broker: $BROKER"
echo "[create-kafka-topics] Partitions: $PARTITIONS | Replication factor: $REPLICATION_FACTOR"
echo ""

for TOPIC in "${TOPICS[@]}"; do
  if kafka-topics.sh --bootstrap-server "$BROKER" --list 2>/dev/null | grep -qx "$TOPIC"; then
    # Topic exists — ensure partition count is up to date
    CURRENT=$(kafka-topics.sh --bootstrap-server "$BROKER" --describe --topic "$TOPIC" 2>/dev/null \
      | grep "PartitionCount" | awk '{print $4}' || echo "0")
    if [ "${CURRENT:-0}" -lt "$PARTITIONS" ]; then
      echo "[create-kafka-topics] Increasing partitions for '$TOPIC': $CURRENT -> $PARTITIONS"
      kafka-topics.sh --bootstrap-server "$BROKER" \
        --alter --topic "$TOPIC" \
        --partitions "$PARTITIONS"
    else
      echo "[create-kafka-topics] '$TOPIC' already has $CURRENT partitions — skipping"
    fi
  else
    echo "[create-kafka-topics] Creating '$TOPIC' ($PARTITIONS partitions)"
    kafka-topics.sh --bootstrap-server "$BROKER" \
      --create --topic "$TOPIC" \
      --partitions "$PARTITIONS" \
      --replication-factor "$REPLICATION_FACTOR" \
      --if-not-exists
  fi
done

echo ""
echo "[create-kafka-topics] Done."
