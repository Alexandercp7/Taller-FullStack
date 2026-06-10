export type NoteVisibility = 'INTERNAL' | 'CLIENT';

export interface NoteRecord {
  id: string;
  orderId: string;
  content: string;
  userId: string;
  visibility: NoteVisibility;
  createdAt: Date;
}

export interface NoteRepository {
  save(note: Omit<NoteRecord, 'id' | 'createdAt'>): Promise<NoteRecord>;
  findByOrderId(orderId: string): Promise<NoteRecord[]>;
  update(id: string, content: string): Promise<void>;
  delete(id: string): Promise<void>;
}
