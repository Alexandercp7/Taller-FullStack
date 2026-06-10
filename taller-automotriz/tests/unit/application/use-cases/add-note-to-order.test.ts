import { describe, it, expect, beforeEach } from 'vitest';
import { AddNoteToOrderUseCase } from '../../../../src/application/use-cases/orders/add-note-to-order.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { InMemoryNoteRepository } from '../../../helpers/in-memory-note.repository';
import { createTestOrder } from '../../../helpers/factories';

describe('AddNoteToOrderUseCase', () => {
  let useCase: AddNoteToOrderUseCase;
  let orderRepo: InMemoryOrderRepository;
  let noteRepo: InMemoryNoteRepository;

  beforeEach(() => {
    const order = createTestOrder({ id: 'order-1' });
    orderRepo = new InMemoryOrderRepository([order]);
    noteRepo = new InMemoryNoteRepository();

    useCase = new AddNoteToOrderUseCase(orderRepo, noteRepo);
  });

  it('agrega una nota a la orden y la retorna', async () => {
    const note = await useCase.execute({ orderId: 'order-1', content: 'Cliente solicitó llamada', userId: 'user-1' });

    expect(note.id).toBeTruthy();
    expect(note.orderId).toBe('order-1');
    expect(note.content).toBe('Cliente solicitó llamada');
    expect(note.userId).toBe('user-1');
    expect(note.createdAt).toBeInstanceOf(Date);
  });

  it('persiste la nota en el repositorio', async () => {
    await useCase.execute({ orderId: 'order-1', content: 'Nota 1', userId: 'user-1' });
    await useCase.execute({ orderId: 'order-1', content: 'Nota 2', userId: 'user-1' });

    const notes = await noteRepo.findByOrderId('order-1');
    expect(notes).toHaveLength(2);
  });

  it('lanza error si la orden no existe', async () => {
    await expect(
      useCase.execute({ orderId: 'no-existe', content: 'Nota', userId: 'user-1' }),
    ).rejects.toThrow('Orden no encontrada');
  });
});
