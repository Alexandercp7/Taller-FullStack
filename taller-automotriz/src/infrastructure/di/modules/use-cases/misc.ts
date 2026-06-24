import { SubmitSurveyUseCase } from '../../../../application/use-cases/quality/submit-survey.use-case';
import { ManageTasksUseCase } from '../../../../application/use-cases/tasks/manage-tasks.use-case';
import { GetKPIsUseCase } from '../../../../application/use-cases/kpis/get-kpis.use-case';
import { GetOrderByTokenUseCase } from '../../../../application/use-cases/portal/get-order-by-token.use-case';
import type { Repos } from '../repositories';

export function buildMiscUseCases(repos: Repos) {
  const { surveyRepo, orderRepo, taskRepo, cashEntryRepo, inventoryRepo, timelineRepo, photoRepo } = repos;
  return {
    submitSurvey: new SubmitSurveyUseCase(surveyRepo, orderRepo),
    manageTasks: new ManageTasksUseCase(taskRepo),
    getKPIs: new GetKPIsUseCase(orderRepo, cashEntryRepo, inventoryRepo),
    getOrderByToken: new GetOrderByTokenUseCase(orderRepo, timelineRepo, photoRepo),
  };
}
