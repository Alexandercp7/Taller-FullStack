import { SurveyRepository } from '../../ports/repositories/survey.repository';
import { OrderRepository } from '../../ports/repositories/order.repository';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

interface SubmitSurveyInput {
  orderId: string;
  token: string;
  rating: number;
  wouldRecommend: boolean;
  comment?: string;
}

export class SubmitSurveyUseCase {
  constructor(
    private readonly surveyRepo: SurveyRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: SubmitSurveyInput): Promise<void> {
    const order = await this.orderRepo.findByPortalToken(input.token);
    if (!order || order.id !== input.orderId) throw new Error('Orden no encontrada');
    if (order.status !== OrderStatus.DELIVERED) throw new Error('La orden no ha sido entregada');

    const existing = await this.surveyRepo.findByOrderId(input.orderId);
    if (existing) throw new Error('Ya se registró una encuesta para esta orden');

    await this.surveyRepo.save({
      orderId: input.orderId,
      rating: input.rating,
      wouldRecommend: input.wouldRecommend,
      comment: input.comment ?? null,
    });
  }
}
