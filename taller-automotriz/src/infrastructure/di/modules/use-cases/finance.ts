import { RegisterCashEntryUseCase } from '../../../../application/use-cases/finance/register-cash-entry.use-case';
import { RegisterARPaymentUseCase } from '../../../../application/use-cases/finance/register-ar-payment.use-case';
import { GetFinancialReportsUseCase } from '../../../../application/use-cases/finance/get-financial-reports.use-case';
import { ListCashEntriesUseCase } from '../../../../application/use-cases/finance/list-cash-entries.use-case';
import { ListAccountsReceivableUseCase } from '../../../../application/use-cases/finance/list-accounts-receivable.use-case';
import { GetComparativeReportUseCase } from '../../../../application/use-cases/finance/get-comparative-report.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildFinanceUseCases(repos: Repos, infra: Infra) {
  const { cashEntryRepo, arRepo, apRepo } = repos;
  const { unitOfWork } = infra;
  return {
    registerCashEntry: new RegisterCashEntryUseCase(cashEntryRepo),
    registerARPayment: new RegisterARPaymentUseCase(arRepo, cashEntryRepo, unitOfWork),
    getFinancialReports: new GetFinancialReportsUseCase(cashEntryRepo, arRepo, apRepo),
    listCashEntries: new ListCashEntriesUseCase(cashEntryRepo),
    listAccountsReceivable: new ListAccountsReceivableUseCase(arRepo),
    getComparativeReport: new GetComparativeReportUseCase(cashEntryRepo),
  };
}
