import { RecallChecker, Recall } from '../../ports/services/recall-checker.port';

interface CheckRecallsInput {
  make: string;
  model: string;
  year: number;
}

export class CheckRecallsUseCase {
  constructor(private readonly recallChecker: RecallChecker) {}

  async execute(input: CheckRecallsInput): Promise<Recall[]> {
    return this.recallChecker.check(input.make, input.model, input.year);
  }
}
