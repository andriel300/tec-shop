export const KafkaTopics = {
  USERS_EVENT: 'users-event',
  LOG_EVENTS: 'log-events',
  CHAT_NEW_MESSAGE: 'chat.new_message',
  NOTIFICATION_EVENTS: 'notification-events',
  ORDER_EVENTS: 'order-events',
  SELLER_EVENTS: 'seller-events',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
