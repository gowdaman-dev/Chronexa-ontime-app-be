export default () => ({
  rmqUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  natsUrl: process.env.NATS_URL ?? 'nats://localhost:4222',
});
