import { SurveyRepository, SurveyRecord } from '../../src/application/ports/repositories/survey.repository';

export class InMemorySurveyRepository implements SurveyRepository {
  private store: SurveyRecord[] = [];
  private seq = 1;

  async findByOrderId(orderId: string): Promise<SurveyRecord | null> {
    return this.store.find((s) => s.orderId === orderId) ?? null;
  }

  async save(survey: Omit<SurveyRecord, 'id' | 'submittedAt'>): Promise<SurveyRecord> {
    const record: SurveyRecord = {
      ...survey,
      id: `survey-${this.seq++}`,
      submittedAt: new Date(),
    };
    this.store.push(record);
    return record;
  }
}
