export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
}

export interface JobQueue {
  enqueue<T extends Record<string, unknown>>(
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<void>;
}
