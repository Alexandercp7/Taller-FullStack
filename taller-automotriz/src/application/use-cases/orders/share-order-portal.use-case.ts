import { OrderRepository } from '../../ports/repositories/order.repository';

export class ShareOrderPortalUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(orderId: string): Promise<{ portalToken: string; portalUrl: string }> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error('Orden no encontrada');

    return {
      portalToken: order.portalToken,
      portalUrl: `/portal/${order.portalToken}`,
    };
  }
}
