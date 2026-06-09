export interface SurveyRecord {
  id: string;
  orderId: string;
  rating: number;
  wouldRecommend: boolean;
  comment: string | null;
  submittedAt: Date;
}

export interface SurveyRepository {
  findByOrderId(orderId: string): Promise<SurveyRecord | null>;
  save(survey: Omit<SurveyRecord, 'id' | 'submittedAt'>): Promise<SurveyRecord>;
}
