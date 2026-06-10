import { NoteRepository, NoteRecord } from '../../src/application/ports/repositories/note.repository';

export class InMemoryNoteRepository implements NoteRepository {
  private store: NoteRecord[] = [];
  private seq = 1;

  async save(note: Omit<NoteRecord, 'id' | 'createdAt'>): Promise<NoteRecord> {
    const record: NoteRecord = { ...note, id: `note-${this.seq++}`, createdAt: new Date() };
    this.store.push(record);
    return record;
  }

  async findByOrderId(orderId: string): Promise<NoteRecord[]> {
    return this.store.filter((n) => n.orderId === orderId);
  }

  async update(id: string, content: string): Promise<void> {
    const note = this.store.find((n) => n.id === id);
    if (note) note.content = content;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((n) => n.id !== id);
  }
}
