import { describe, it, expect, beforeEach } from 'vitest';
import { SubmitSurveyUseCase } from '../../../../src/application/use-cases/quality/submit-survey.use-case';
import { InMemorySurveyRepository } from '../../../helpers/in-memory-survey.repository';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { createTestOrder } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';

describe('SubmitSurveyUseCase', () => {
  let surveyRepo: InMemorySurveyRepository;
  let orderRepo: InMemoryOrderRepository;
  let useCase: SubmitSurveyUseCase;

  beforeEach(() => {
    surveyRepo = new InMemorySurveyRepository();
    orderRepo = new InMemoryOrderRepository();
    useCase = new SubmitSurveyUseCase(surveyRepo, orderRepo);
  });

  it('registra la encuesta cuando la orden fue entregada y el token es válido', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.DELIVERED });
    await orderRepo.save(order);

    await useCase.execute({
      orderId: 'order-1',
      token: order.portalToken,
      rating: 5,
      wouldRecommend: true,
      comment: 'Excelente servicio',
    });

    const saved = await surveyRepo.findByOrderId('order-1');
    expect(saved).not.toBeNull();
    expect(saved?.rating).toBe(5);
    expect(saved?.wouldRecommend).toBe(true);
    expect(saved?.comment).toBe('Excelente servicio');
  });

  it('lanza error si el token no corresponde a la orden', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.DELIVERED });
    await orderRepo.save(order);

    await expect(
      useCase.execute({ orderId: 'order-1', token: 'token-invalido', rating: 5, wouldRecommend: true }),
    ).rejects.toThrow('Orden no encontrada');
  });

  it('lanza error si el id de orden no coincide con el de la orden encontrada por token', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.DELIVERED });
    await orderRepo.save(order);

    await expect(
      useCase.execute({ orderId: 'otra-orden', token: order.portalToken, rating: 5, wouldRecommend: true }),
    ).rejects.toThrow('Orden no encontrada');
  });

  it('lanza error si la orden no ha sido entregada', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.IN_PROGRESS });
    await orderRepo.save(order);

    await expect(
      useCase.execute({ orderId: 'order-1', token: order.portalToken, rating: 4, wouldRecommend: true }),
    ).rejects.toThrow('La orden no ha sido entregada');
  });

  it('lanza error si ya existe una encuesta para la orden', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.DELIVERED });
    await orderRepo.save(order);
    await surveyRepo.save({ orderId: 'order-1', rating: 5, wouldRecommend: true, comment: null });

    await expect(
      useCase.execute({ orderId: 'order-1', token: order.portalToken, rating: 3, wouldRecommend: false }),
    ).rejects.toThrow('Ya se registró una encuesta para esta orden');
  });
});
