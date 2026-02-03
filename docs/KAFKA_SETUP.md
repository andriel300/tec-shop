# Kafka Setup Guide for TecShop

This guide explains how to set up and use Apache Kafka for local development in the TecShop microservices platform.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Local Development Setup](#local-development-setup)
- [Production/Cloud Setup](#productioncloud-setup)
- [Kafka Topics](#kafka-topics)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

TecShop uses Apache Kafka for asynchronous event streaming and communication between microservices:

- **Analytics Events**: User interactions, product views, purchases
- **Chat Messages**: Real-time chat message distribution

### Services Using Kafka

| Service            | Role     | Topics                   | Purpose                          |
| ------------------ | -------- | ------------------------ | -------------------------------- |
| `api-gateway`      | Producer | `users-event`            | Sends analytics events           |
| `order-service`    | Producer | `users-event`            | Sends purchase events            |
| `chatting-service` | Both     | `chat.new_message`       | Chat message streaming           |
| `kafka-service`    | Consumer | `users-event`            | Processes analytics in batch     |
| `chatting-service` | Consumer | `chat.new_message`       | Saves messages to DB and WebSocket |

---

## Quick Start

### 1. Start Local Kafka

```bash
# Start Kafka, Zookeeper, and Kafka UI
docker-compose -f docker-compose.kafka.yml up -d

# Verify Kafka is running
docker ps | grep kafka
```

### 2. Configure Environment Variables

Ensure your `.env` file contains:

```bash
# Local Kafka (no authentication)
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=tec-shop
```

### 3. Verify Topics

```bash
# Topics are auto-created by docker-compose.kafka.yml
# You can also run the initialization script manually:
./scripts/kafka-topics-init.sh
```

### 4. Access Kafka UI

Open your browser to [http://localhost:8090](http://localhost:8090) to view:

- Topics and partitions
- Consumer groups
- Messages in real-time
- Broker status

---

## Architecture

### Event Flow Diagram

```
┌─────────────────┐
│   API Gateway   │
│  (Analytics)    │
└────────┬────────┘
         │ users-event
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Kafka Broker   │◄─────┤  Order Service   │
│  (localhost:9092)│      │  (Purchase)      │
└────────┬────────┘      └──────────────────┘
         │ users-event
         ▼
┌─────────────────┐
│  Kafka Service  │
│  (Analytics DB) │
└─────────────────┘


┌─────────────────┐
│ Chatting Service│
│  (WebSocket)    │
└────────┬────────┘
         │ chat.new_message
         ▼
┌─────────────────┐
│  Kafka Broker   │
└────────┬────────┘
         │ chat.new_message
         ▼
┌─────────────────┐
│ Chat Consumer   │
│ (DB + Cache)    │
└─────────────────┘
```

---

## Local Development Setup

### Prerequisites

- Docker and Docker Compose installed
- At least 1GB free RAM

### Step-by-Step Setup

#### 1. Start Kafka Infrastructure

```bash
docker-compose -f docker-compose.kafka.yml up -d
```

This starts:
- **Zookeeper** (Port 2181): Kafka cluster coordination
- **Kafka Broker** (Port 9092): Message broker
- **Kafka UI** (Port 8090): Web-based management interface
- **Topic Initialization**: Automatically creates required topics

#### 2. Verify Kafka is Running

```bash
# Check containers
docker ps

# You should see:
# - tec-shop-zookeeper
# - tec-shop-kafka
# - tec-shop-kafka-ui
```

#### 3. View Kafka Logs

```bash
# Kafka broker logs
docker logs tec-shop-kafka -f

# Zookeeper logs
docker logs tec-shop-zookeeper -f
```

#### 4. Stop Kafka

```bash
docker-compose -f docker-compose.kafka.yml down

# To remove volumes (delete all data):
docker-compose -f docker-compose.kafka.yml down -v
```

---

## Production/Cloud Setup

For production or cloud Kafka services (Confluent Cloud, RedPanda Cloud, AWS MSK, etc.):

### 1. Update Environment Variables

```bash
# Cloud Kafka with SCRAM-SHA-256 authentication
KAFKA_BROKER=your-cloud-broker.kafka.com:9092
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

### 2. How It Works

All services automatically detect authentication credentials:

```typescript
// If KAFKA_USERNAME and KAFKA_PASSWORD are provided:
// - Enables SSL
// - Enables SCRAM-SHA-256 authentication
// - Connects to cloud Kafka

// If credentials are missing:
// - No SSL
// - No authentication
// - Connects to local Kafka (localhost:9092)
```

### 3. Legacy RedPanda Variables

For backward compatibility, legacy RedPanda variables are still supported:

```bash
REDPANDA_BROKER=your-broker:9092
REDPANDA_USERNAME=your-username
REDPANDA_PASSWORD=your-password
```

These will be mapped to `KAFKA_*` variables automatically.

---

## Kafka Topics

### Topic: `users-event`

**Purpose**: Analytics events for user interactions

**Configuration**:
- Partitions: 3
- Replication Factor: 1 (local), 3 (production)
- Retention: 30 days (2592000000 ms)

**Producers**:
- `api-gateway` (POST /analytics/track)
- `order-service` (after checkout)

**Consumer**:
- `kafka-service` (group: `kafka-service-group`)

**Message Schema**:
```json
{
  "userId": "string (required)",
  "productId": "string (optional)",
  "shopId": "string (optional)",
  "action": "string (required)",
  "country": "string (optional)",
  "city": "string (optional)",
  "device": "string (optional)",
  "timestamp": "ISO8601 string"
}
```

**Valid Actions**:
- `add_to_wishlist`
- `remove_from_wishlist`
- `add_to_cart`
- `remove_from_cart`
- `product_view`
- `shop_visit`
- `purchase`

---

### Topic: `chat.new_message`

**Purpose**: Real-time chat message distribution

**Configuration**:
- Partitions: 3
- Replication Factor: 1 (local), 3 (production)
- Retention: 7 days (604800000 ms)

**Producer**:
- `chatting-service` (ChatGateway via WebSocket)

**Consumer**:
- `chatting-service` (group: `chat-message-db-writter`)

**Message Schema**:
```json
{
  "conversationId": "string (required)",
  "senderId": "string (required)",
  "senderType": "user | seller",
  "content": "string (1-5000 chars)",
  "attachments": [
    {
      "url": "string",
      "type": "string (optional)"
    }
  ],
  "createdAt": "ISO8601 string"
}
```

---

## Monitoring

### Kafka UI (Recommended)

Access at [http://localhost:8090](http://localhost:8090)

Features:
- Topic management
- Consumer group monitoring
- Message browsing
- Partition details
- Broker health

### Command Line Tools

All Kafka CLI tools are available inside the Kafka container:

```bash
# Enter Kafka container
docker exec -it tec-shop-kafka bash

# List topics
kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
kafka-topics --describe --topic users-event --bootstrap-server localhost:9092

# View consumer groups
kafka-consumer-groups --list --bootstrap-server localhost:9092

# Check consumer lag
kafka-consumer-groups --describe --group kafka-service-group --bootstrap-server localhost:9092

# Consume messages from beginning
kafka-console-consumer --topic users-event --from-beginning --bootstrap-server localhost:9092

# Produce test message
kafka-console-producer --topic users-event --bootstrap-server localhost:9092
```

### Application Logs

Each service logs Kafka connection status:

```bash
# API Gateway logs
[KafkaProducerService] Kafka authentication disabled (local development mode)
[KafkaProducerService] Kafka producer connected successfully

# Kafka Service logs
[KafkaServiceBootstrap] Environment variables validated successfully
[KafkaServiceBootstrap] Kafka authentication disabled (local development mode)
[KafkaServiceBootstrap] Kafka microservice connected successfully
[KafkaServiceBootstrap] Listening to topic: users-event (group: kafka-service-group)
```

---

## Troubleshooting

### Issue: "Cannot connect to Kafka"

**Solution 1**: Verify Kafka is running
```bash
docker ps | grep kafka
```

**Solution 2**: Check Kafka health
```bash
docker logs tec-shop-kafka | tail -20
```

**Solution 3**: Restart Kafka
```bash
docker-compose -f docker-compose.kafka.yml restart kafka
```

---

### Issue: "Topic does not exist"

**Solution 1**: Run topic initialization
```bash
./scripts/kafka-topics-init.sh
```

**Solution 2**: Enable auto-creation (development only)
In `docker-compose.kafka.yml`, set:
```yaml
KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
```

**Solution 3**: Create topic manually
```bash
docker exec -it tec-shop-kafka kafka-topics \
  --create \
  --topic your-topic-name \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

---

### Issue: "Consumer group not processing messages"

**Check consumer lag**:
```bash
docker exec -it tec-shop-kafka kafka-consumer-groups \
  --describe \
  --group kafka-service-group \
  --bootstrap-server localhost:9092
```

**Reset consumer group** (development only):
```bash
docker exec -it tec-shop-kafka kafka-consumer-groups \
  --reset-offsets \
  --to-earliest \
  --group kafka-service-group \
  --topic users-event \
  --execute \
  --bootstrap-server localhost:9092
```

---

### Issue: "Out of memory / Kafka won't start"

Kafka requires ~500MB RAM. If Docker doesn't have enough:

**Solution**: Increase Docker memory limit
- Docker Desktop: Settings → Resources → Memory → Set to at least 4GB

---

### Issue: "Port 9092 already in use"

**Solution 1**: Stop conflicting service
```bash
lsof -ti:9092 | xargs kill -9
```

**Solution 2**: Change Kafka port
Edit `docker-compose.kafka.yml`:
```yaml
ports:
  - '9093:9092'  # Use port 9093 instead

# Also update .env:
KAFKA_BROKER=localhost:9093
```

---

### Issue: "Messages not appearing in Kafka UI"

**Solution**: Wait for Kafka UI to sync
Kafka UI updates every few seconds. Refresh the page.

---

### Issue: "SCRAM authentication failed"

This means you're trying to connect to cloud Kafka with wrong credentials.

**Solution 1**: Check environment variables
```bash
echo $KAFKA_USERNAME
echo $KAFKA_PASSWORD
```

**Solution 2**: For local development, remove credentials
```bash
# In .env, comment out or remove:
# KAFKA_USERNAME=...
# KAFKA_PASSWORD=...
```

---

## Performance Tuning

### Local Development

Default settings are optimized for local development:
- 3 partitions per topic
- Replication factor: 1
- Retention: 7-30 days

### Production Recommendations

```yaml
# Increase partitions for high throughput
--partitions 6

# Enable replication for fault tolerance
--replication-factor 3

# Tune retention based on needs
--config retention.ms=604800000  # 7 days
--config segment.ms=86400000     # 1 day segments
```

### Consumer Configuration

For high-throughput consumers:

```typescript
consumer: {
  groupId: 'your-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 100,      // Reduce latency
  fetchMinBytes: 1,           // Process small batches
  fetchMaxBytes: 1048576,     // 1MB max fetch
}
```

---

## Additional Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Kafka UI Documentation](https://docs.kafka-ui.provectus.io/)
- [NestJS Microservices - Kafka](https://docs.nestjs.com/microservices/kafka)

---

## Support

For issues specific to TecShop Kafka integration:
1. Check service logs: `docker logs tec-shop-kafka`
2. Verify environment variables in `.env`
3. Check Kafka UI at [http://localhost:8090](http://localhost:8090)
4. Review this documentation

For Kafka-specific questions, refer to the official Apache Kafka documentation.
