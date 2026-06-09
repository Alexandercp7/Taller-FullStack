import { OrderRepository } from '../../ports/repositories/order.repository';
import { NoteRepository, NoteRecord } from '../../ports/repositories/note.repository';

interface AddNoteInput {
  orderId: string;
  content: string;
  userId: string;
}

export class AddNoteToOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly noteRepo: NoteRepository,
  ) {}

  async execute(input: AddNoteInput): Promise<NoteRecord> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');
    return this.noteRepo.save({ orderId: input.orderId, content: input.content, userId: input.userId });
  }
}
