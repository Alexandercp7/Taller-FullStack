export interface Recall {
  id: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportedDate: string;
}

export interface RecallChecker {
  check(make: string, model: string, year: number): Promise<Recall[]>;
}
