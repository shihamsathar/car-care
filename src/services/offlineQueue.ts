import { JobPhoto } from '../types';

export interface QueuedPhotoUpload {
  id: string;
  jobId: string;
  photo: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>;
  status: 'pending' | 'uploading' | 'failed' | 'synced';
  attempts: number;
  errorMessage?: string;
  queuedAt: string;
}

const OFFLINE_QUEUE_KEY = 'carcare_tech_offline_photo_queue_v1';

export class OfflineQueueService {
  private static listeners: Array<(count: number) => void> = [];

  static subscribe(listener: (count: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.getPendingCount());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    const count = this.getPendingCount();
    this.listeners.forEach((l) => l(count));
  }

  static getQueue(): QueuedPhotoUpload[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getPendingCount(): number {
    return this.getQueue().filter((q) => q.status === 'pending' || q.status === 'failed' || q.status === 'uploading').length;
  }

  static hasPendingUploads(jobId: string): boolean {
    return this.getQueue().some((q) => q.jobId === jobId && q.status !== 'synced');
  }

  static enqueue(jobId: string, photo: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>): QueuedPhotoUpload {
    const queue = this.getQueue();
    const item: QueuedPhotoUpload = {
      id: `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      jobId,
      photo,
      status: 'pending',
      attempts: 0,
      queuedAt: new Date().toISOString(),
    };
    const updated = [...queue, item];
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Offline queue storage error', e);
    }
    this.notify();
    return item;
  }

  static markSynced(queueId: string) {
    const queue = this.getQueue().filter((q) => q.id !== queueId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    this.notify();
  }

  static clearJobQueue(jobId: string) {
    const queue = this.getQueue().filter((q) => q.jobId !== jobId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    this.notify();
  }

  /**
   * Syncs all queued photos when device is online
   */
  static async processQueue(onSuccess: (jobId: string, photo: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>) => void): Promise<number> {
    if (!navigator.onLine) {
      return this.getPendingCount();
    }

    const queue = this.getQueue().filter((q) => q.status !== 'synced');
    if (queue.length === 0) return 0;

    let processedCount = 0;
    for (const item of queue) {
      try {
        item.status = 'uploading';
        item.attempts += 1;
        // Simulate network transmit latency
        await new Promise((resolve) => setTimeout(resolve, 300));
        onSuccess(item.jobId, item.photo);
        this.markSynced(item.id);
        processedCount++;
      } catch (err: any) {
        item.status = 'failed';
        item.errorMessage = err?.message || 'Sync failed';
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    }

    this.notify();
    return this.getPendingCount();
  }
}
