export default () => ({
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  natsUrl: process.env.NATS_URL ?? 'nats://localhost:4222',
});
