import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { JobQueue, JobOptions } from '../../application/ports/services/job-queue.port';

const QUEUES: Record<string, Queue> = {};

function getQueue(name: string, redis: Redis): Queue {
  if (!QUEUES[name]) {
    QUEUES[name] = new Queue(name, { connection: redis });
  }
  return QUEUES[name];
}

export class BullMQJobQueueAdapter implements JobQueue {
  constructor(private readonly redis: Redis) {}

  async enqueue<T extends Record<string, unknown>>(
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<void> {
    const queue = getQueue(jobName, this.redis);
    await queue.add(jobName, data, {
      delay: options?.delay,
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? { type: 'exponential', delay: 1000 },
    });
  }
}
