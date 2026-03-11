# ADR-0010: Kafka for Asynchronous Event Streaming

## Status
Accepted

## Context
Several platform operations are fire-and-forget from the perspective of the
originating service: logging user behaviour for analytics, sending notifications
after order state changes, broadcasting seller activity events, and feeding the
recommendation engine. Handling these synchronously in the request path would add
latency and couple unrelated domains.

## Decision
We adopted Apache Kafka (via kafkajs v2) for all asynchronous event streaming.
A dedicated `kafka-service` NestJS application acts as the primary Kafka consumer
for analytics events. Other services act as producers via the `@tec-shop/kafka-events`
shared library.

Topics and their producers/consumers:

| Topic                | Producer(s)         | Consumer(s)              |
|----------------------|---------------------|--------------------------|
| `users-event`        | auth-service        | kafka-service (analytics)|
| `order-events`       | order-service       | notification-service     |
| `seller-events`      | seller-service      | kafka-service            |
| `notification-events`| multiple services   | notification-service     |
| `log-events`         | multiple services   | logger-service           |
| `chat.new_message`   | chatting-service    | notification-service     |

Production brokers use SCRAM-SHA-256 + SSL authentication. The kafka-service detects
localhost/container brokers and skips SSL for local development.

## Alternatives Considered
- **RabbitMQ** — simpler to operate, but lacks Kafka's log-based durability and
  consumer group replay capability needed for analytics event reprocessing.
- **Direct TCP calls for notifications** — would create synchronous coupling between
  order-service and notification-service, degrading order creation latency.
- **Bull/Redis queues** — suitable for job queues but not for event streaming
  with multiple independent consumers and durable replay.

## Consequences
- **Positive:** Decoupled producers and consumers; durable message log enables
  event replay for analytics backfill; consumer groups allow independent scaling
  of consumers.
- **Negative:** Kafka requires Zookeeper (or KRaft) in development; adds operational
  complexity; messages are eventually consistent — downstream services may lag.

## Trade-offs
Operational complexity of running Kafka was accepted for the durability, replay, and
fan-out capabilities that simpler queue systems do not provide.
