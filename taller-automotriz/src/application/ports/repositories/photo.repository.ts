import { PhotoPhase } from '../../../domain/enums/photo-phase.enum';

export interface PhotoRecord {
  id: string;
  orderId: string;
  phase: PhotoPhase;
  url: string;
  key: string;
  caption: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export interface PhotoRepository {
  save(photo: Omit<PhotoRecord, 'id' | 'createdAt'>): Promise<PhotoRecord>;
  findByOrderId(orderId: string, phase?: PhotoPhase): Promise<PhotoRecord[]>;
  delete(id: string): Promise<void>;
}
